import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Eye,
  Heart,
  MapPin,
  UserCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { notify } from "../../utils/notify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import {
  JobApplication,
  JobMatch,
  TalentAnalytics,
} from "../../types/talent-dashboard";
import JobList from "../jobs/JobList";

export default function TalentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUserData(user?.id);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [analytics, setAnalytics] = useState<TalentAnalytics | null>(null);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const talent = data?.talent;
  const profile = data?.profile;

  const loadDashboardData = useCallback(async () => {
    if (!user || !talent) {
      setIsDashboardLoading(true);
      return;
    }

    setIsDashboardLoading(true);

    try {
      const [applicationsResult, matchesResult, analyticsResult, jobsResult] = await Promise.all([
        db.getApplications({ talent_id: talent.id }),
        db.getMatches({ talent_id: user.id }),
        db.getAnalytics(user.id, "talent").catch(() => null),
        db.getJobs({})
      ]);

      if (applicationsResult.data) {
        setApplications(applicationsResult.data.slice(0, 4));
      }

      if (matchesResult.data) {
        setMatches(matchesResult.data.slice(0, 5));
      }

      if (analyticsResult && !analyticsResult.error) {
        const analyticsData = "data" in analyticsResult ? analyticsResult.data : analyticsResult;
        setAnalytics({
          profileViews: analyticsData.profileViews || 0,
          applications: analyticsData.applications || 0,
          matches: analyticsData.matches || 0,
          messages: analyticsData.messages || 0,
        });
      } else {
        setAnalytics({
          profileViews: 0,
          applications: 0,
          matches: 0,
          messages: 0,
        });
      }

      if (jobsResult.data) {
        setAllJobs(jobsResult.data);
      }
    } catch (error: any) {
      if (!error?.message?.includes('fetch') && !error?.message?.includes('network')) {
        notify.showError("Failed to load dashboard data");
      }
      setAnalytics({
        profileViews: 0,
        applications: 0,
        matches: 0,
        messages: 0,
      });
    } finally {
      setIsDashboardLoading(false);
    }
  }, [user, talent]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getApplicationStatusColor = (status: string) => {
    const colors = {
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      reviewed: "bg-blue-100 text-blue-700 border-blue-200",
      interview: "bg-orange-100 text-orange-700 border-orange-200",
      offer: "bg-green-100 text-green-700 border-green-200",
      accepted: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
      withdrawn: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colors[status as keyof typeof colors] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100 border-green-200";
    if (score >= 80) return "text-blue-600 bg-blue-100 border-blue-200";
    return "text-orange-600 bg-orange-100 border-orange-200";
  };

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-pulse">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-200 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div className="h-9 w-16 bg-slate-200 rounded"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error loading profile: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-6">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-20 h-20 rounded-2xl border-2 border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200">
                    <UserCircle size={48} weight="regular" className="text-slate-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Welcome back, {profile?.full_name}! 👋
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Here's what's happening with your job search today.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/talent/jobs"
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Briefcase size={20} weight="regular" className="mr-2" /> Browse Jobs
                </Link>
                <Link
                  to="/talent/applications"
                  className="inline-flex items-center px-6 py-3 bg-white text-primary border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Eye size={20} weight="regular" className="mr-2" /> Applications
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Removed Messages Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Eye size={24} weight="regular" className="text-primary" />
              </div>
              <div className="text-right">
                {isDashboardLoading ? (
                  <div className="h-9 w-16 bg-slate-100 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics?.profileViews || 0}
                  </p>
                )}
              </div>
            </div>
            <p className="text-slate-600 font-medium">Profile Views</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Briefcase size={24} weight="regular" className="text-primary" />
              </div>
              <div className="text-right">
                {isDashboardLoading ? (
                  <div className="h-9 w-16 bg-slate-100 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics?.applications || 0}
                  </p>
                )}
              </div>
            </div>
            <p className="text-slate-600 font-medium">Applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <Heart size={24} weight="regular" className="text-primary" />
              </div>
              <div className="text-right">
                {isDashboardLoading ? (
                  <div className="h-9 w-16 bg-slate-100 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics?.matches || 0}
                  </p>
                )}
              </div>
            </div>
            <p className="text-slate-600 font-medium">AI Matches</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Matches */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <Heart size={24} weight="regular" className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Top AI Matches
                  </h2>
                </div>
                <button className="text-primary hover:text-blue-700 text-sm font-medium px-4 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {matches.length > 0 ? (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition-all duration-200"
                    >
                      <img
                        src={
                          match.job?.companies?.logo_url ||
                          "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100"
                        }
                        alt={match.job?.companies?.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900 truncate">
                              {match.job?.title}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {match.job?.companies?.name}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <MapPin size={12} weight="regular" />
                                <span>{match.job?.location || "Remote"}</span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getMatchColor(
                              match.matchScore
                            )}`}
                          >
                            {Math.round(match.matchScore)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart size={48} weight="regular" className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No matches found yet</p>
                  <p className="text-sm text-slate-400">
                    Complete your profile to get better matches
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Applications - Smaller & Cleaner */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <Briefcase size={24} weight="regular" className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recent Applications
                  </h2>
                </div>
                <Link
                  to="/talent/applications"
                  className="text-primary hover:text-blue-700 text-sm font-medium px-4 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/jobs/${application.job?.id}`)}
                      className="group bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary font-bold text-sm">
                          {application.job?.companies?.name?.charAt(0) || application.job?.title?.charAt(0) || 'J'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-900 truncate text-sm group-hover:text-primary transition-colors">
                                {application.job?.title}
                              </h3>
                              <p className="text-xs text-slate-600 font-medium mt-0.5">
                                {application.job?.companies?.name}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center text-xs text-slate-500">
                                  <Calendar size={12} weight="regular" className="mr-1" />
                                  <span>
                                    {new Date(application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getApplicationStatusColor(
                                application.status
                              )}`}
                            >
                              {application.status.charAt(0).toUpperCase() +
                                application.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <Briefcase size={32} weight="regular" className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No applications yet</h3>
                  <p className="text-slate-500 mb-6">
                    Start applying to jobs to see them here
                  </p>
                  <Link
                    to="/talent/jobs"
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Briefcase size={20} weight="regular" className="mr-2" />
                    Browse Jobs
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Profile Completion */}
        {talent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-primary rounded-2xl p-8 text-white shadow-sm"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <UserCircle size={24} weight="regular" className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">
                    Complete Your Profile
                  </h3>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  A complete profile gets 3x more views from companies
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="bg-white/20 rounded-full h-3">
                      <div className="bg-white rounded-full h-3 w-4/5"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">85%</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/talent-profile"
                  className="px-6 py-3 bg-white text-primary rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  Complete Profile
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Offers Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl">
                  <Briefcase size={24} weight="regular" className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  All Job Offers
                </h2>
              </div>
              <Link
                to="/talent/jobs"
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View All Jobs
              </Link>
            </div>
            <JobList jobs={allJobs} showSearch={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

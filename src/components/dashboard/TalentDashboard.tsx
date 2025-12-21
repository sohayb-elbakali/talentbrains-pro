import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Eye,
  MapPin,
  UserCircle,
  Lightning,
  ChartLineUp,
  Buildings,
  Star,
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
import LoadingSpinner from "../ui/LoadingSpinner";

export default function TalentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUserData(user?.id);
  const [matches, setMatches] = useState<any[]>([]);
  const [excellentMatchCount, setExcellentMatchCount] = useState(0);
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

      // Fetch real matches from backend matching API
      let allMatches: any[] = [];

      try {
        const matchResponse = await fetch(`http://localhost:8000/api/matching/talent/${talent.id}/jobs?limit=10`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (matchResponse.ok) {
          const matchingResults = await matchResponse.json();

          // Get job details
          const jobsMap = new Map((jobsResult.data || []).map((j: any) => [j.id, j]));

          allMatches = matchingResults.map((m: any) => {
            const jobData: any = jobsMap.get(m.job_id) || {};
            return {
              id: `match-${m.job_id}`,
              job_id: m.job_id,
              matchScore: m.match_score || 0,
              skillScore: m.skill_match_score || 0,
              experienceScore: m.experience_match_score || 0,
              locationScore: m.location_match_score || 0,
              matched_skills: m.matched_skills || [],
              job: {
                id: m.job_id,
                title: jobData.title || m.job_title || 'Position',
                location: jobData.location || m.location,
                companies: jobData.companies || { name: m.company || 'Company' },
              },
            };
          });
        }
      } catch (err) {
        // Fallback to stored matches if API fails
        if (matchesResult.data && matchesResult.data.length > 0) {
          allMatches = matchesResult.data.map((m: any) => ({
            ...m,
            matchScore: m.match_score || 0,
          }));
        }
      }

      // Sort by score and get top 3
      allMatches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setMatches(allMatches.slice(0, 3));

      // Count excellent matches (80%+)
      const excellent = allMatches.filter(m => (m.matchScore || 0) >= 80).length;
      setExcellentMatchCount(excellent);

      if (analyticsResult && !analyticsResult.error) {
        const analyticsData = "data" in analyticsResult ? analyticsResult.data : analyticsResult;
        setAnalytics({
          profileViews: analyticsData.profileViews || 0,
          applications: analyticsData.applications || 0,
          matches: allMatches.length,
          messages: analyticsData.messages || 0,
        });
      } else {
        setAnalytics({
          profileViews: 0,
          applications: 0,
          matches: allMatches.length,
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
    if (score >= 80) return "text-blue-600 bg-blue-100 border-blue-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-100";
    return "text-slate-600 bg-slate-100 border-slate-200";
  };

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Preparing your dashboard..." />
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Eye size={24} weight="duotone" className="text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                  {analytics?.profileViews || 0}
                </p>
              </div>
            </div>
            <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Profile Views</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Briefcase size={24} weight="duotone" className="text-primary" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                  {analytics?.applications || 0}
                </p>
              </div>
            </div>
            <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Applications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <Lightning size={24} weight="duotone" className="text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                  {analytics?.matches || 0}
                </p>
              </div>
            </div>
            <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider">AI Matches</p>
          </motion.div>

          {/* Excellent Matches Counter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Star size={24} weight="fill" className="text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600 tracking-tight">
                  {excellentMatchCount}
                </p>
              </div>
            </div>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Excellent (80%+)</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 3 Matches */}
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
                    <Lightning size={24} weight="fill" className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Top AI Matches
                  </h2>
                </div>
                <Link to="/talent/matches" className="text-primary hover:text-blue-700 text-sm font-medium px-4 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match, idx) => (
                    <motion.div
                      key={match.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <Buildings size={24} weight="regular" className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {match.job?.title}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium">
                          {match.job?.companies?.name}
                        </p>
                        {match.job?.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} weight="regular" />
                            {match.job.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${getMatchColor(match.matchScore)}`}>
                          {match.matchScore > 0 ? `${Math.round(match.matchScore)}%` : 'New'}
                        </span>
                        <Link
                          to={`/jobs/${match.job?.id || match.job_id}`}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightning size={48} weight="regular" className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No matches found yet</p>
                  <p className="text-sm text-slate-400">
                    Complete your profile to get better matches
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Applications */}
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
            className="mt-8 bg-slate-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <ChartLineUp size={24} weight="bold" className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Boost your visibility</h3>
                  <p className="text-slate-500 text-sm">A complete profile gets 3x more views from top companies.</p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex-1 md:w-48">
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-slate-400">
                    <span>COMPLETION</span>
                    <span className="text-blue-600">85%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full w-[85%]" />
                  </div>
                </div>
                <Link
                  to="/talent-profile"
                  className="whitespace-nowrap px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                >
                  Finish Now
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

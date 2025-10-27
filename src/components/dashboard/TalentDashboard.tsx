import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { notificationManager } from "../../utils/notificationManager";
import { Link } from "react-router-dom";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { useDataRefresh } from "../../hooks/useDataRefresh";
import { db } from "../../lib/supabase";
import {
  JobApplication,
  JobMatch,
  TalentAnalytics,
} from "../../types/talent-dashboard";
import JobList from "../JobList";

export default function TalentDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useUserData(user?.id);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [analytics, setAnalytics] = useState<TalentAnalytics>({
    profileViews: 0,
    applications: 0,
    matches: 0,
    messages: 0,
  });
  const [allJobs, setAllJobs] = useState<any[]>([]);

  const talent = data?.talent;
  const profile = data?.profile;

  const loadDashboardData = useCallback(async () => {
    if (!user || !talent) return;
    try {
      // Load all data in parallel for better performance
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
      }

      if (jobsResult.data) {
        setAllJobs(jobsResult.data);
      }
    } catch (error) {
      notificationManager.showError("Failed to load dashboard data");
    }
  }, [user, talent]);

  // Load data only once when component mounts or when user/talent changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // REMOVED: useDataRefresh - it was causing unnecessary reloads

  // Real-time subscription disabled - can be enabled when Supabase Realtime is configured
  // useEffect(() => {
  //   if (!talent?.id) return;
  //   const subscription = supabase
  //     .channel("dashboard-applications-changes")
  //     .on("postgres_changes", {
  //       event: "UPDATE",
  //       schema: "public",
  //       table: "applications",
  //       filter: `talent_id=eq.${talent.id}`,
  //     }, (payload: any) => {
  //       loadDashboardData();
  //     })
  //     .subscribe();
  //   return () => subscription.unsubscribe();
  // }, [talent?.id, loadDashboardData]);

  const getApplicationStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800",
      interview: "bg-purple-100 text-purple-800",
      offer: "bg-green-100 text-green-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    return "text-orange-600 bg-orange-100";
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  if (error) {
    return <div>Error loading profile: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-6">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-20 h-20 rounded-2xl border-4 border-purple-200 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center border-4 border-purple-200 shadow-lg">
                    <UserCircle className="text-white" size={48} />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {profile?.full_name}! 👋
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Here's what's happening with your job search today.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/talent/jobs"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Briefcase className="mr-2 h-5 w-5" /> Browse Jobs
                </Link>
                <Link
                  to="/talent/applications"
                  className="inline-flex items-center px-6 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 transform hover:scale-105"
                >
                  <Eye className="mr-2 h-5 w-5" /> Applications
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {analytics.profileViews || 0}
                </p>
              </div>
            </div>
            <p className="text-purple-100 font-medium">Profile Views</p>
            <p className="text-xs text-purple-200 mt-2">+12% from last week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {analytics.applications || 0}
                </p>
              </div>
            </div>
            <p className="text-blue-100 font-medium">Applications</p>
            <p className="text-xs text-blue-200 mt-2">
              {applications.filter((app) => app.status === "reviewed").length}{" "}
              pending
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {analytics.matches || 0}
                </p>
              </div>
            </div>
            <p className="text-green-100 font-medium">AI Matches</p>
            <p className="text-xs text-green-200 mt-2">5 new this week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">8</p>
              </div>
            </div>
            <p className="text-orange-100 font-medium">Messages</p>
            <p className="text-xs text-orange-200 mt-2">2 unread</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Matches */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Top AI Matches
                  </h2>
                </div>
                <button className="text-white hover:text-purple-100 text-sm font-medium px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all">
                  View All
                </button>
              </div>
            </div>
          <div className="p-6">
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={
                        match.job?.companies?.logo_url ||
                        "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100"
                      }
                      alt={match.job?.companies?.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {match.job?.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {match.job?.companies?.name}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{match.job?.location || "Remote"}</span>
                            </div>
                            {match.job?.salary_min && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  ${match.job.salary_min}k - $
                                  {match.job.salary_max}k
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(
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
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No matches found yet</p>
                <p className="text-sm text-gray-400">
                  Complete your profile to get better matches
                </p>
              </div>
            )}
          </div>
        </motion.div>

          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Recent Applications
                  </h2>
                </div>
                <Link
                  to="/talent/applications"
                  className="text-white hover:text-blue-100 text-sm font-medium px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all"
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/jobs/${application.job?.id}`)}
                      className="group relative bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Company Logo with gradient background */}
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl blur opacity-20"></div>
                          <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {application.job?.companies?.name?.charAt(0) || application.job?.title?.charAt(0) || 'J'}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 truncate text-base group-hover:text-blue-600 transition-colors">
                                {application.job?.title}
                              </h3>
                              <p className="text-sm text-gray-600 font-medium mt-0.5">
                                {application.job?.companies?.name}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="h-3.5 w-3.5 mr-1" />
                                  <span>
                                    {new Date(application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${getApplicationStatusColor(
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-500 mb-6">
                    Start applying to jobs to see them here
                  </p>
                  <Link
                    to="/talent/jobs"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    <Briefcase className="h-5 w-5 mr-2" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">
                    Complete Your Profile
                  </h3>
                </div>
                <p className="text-purple-100 text-lg mb-4">
                  A complete profile gets 3x more views from companies
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="bg-white/20 rounded-full h-3 backdrop-blur-sm">
                      <div className="bg-white rounded-full h-3 w-4/5 shadow-lg"></div>
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
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Complete Profile
                </Link>
                <button className="px-6 py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                  Add Skills
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Offers Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  All Job Offers
                </h2>
              </div>
              <Link
                to="/talent/jobs"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
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

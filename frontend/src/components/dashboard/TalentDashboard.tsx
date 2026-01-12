import {
  Briefcase,
  CheckCircle,
  CalendarBlank,
  WifiX,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { notify } from "../../utils/notify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { useNetworkStatus } from "../../hooks/useNetworkResilience";
import { db } from "../../lib/supabase/index";
import {
  JobApplication,
  TalentAnalytics,
} from "../../types/talent-dashboard";
import JobList from "../jobs/JobList";
import { JobCard } from "../jobs/JobCard";
import { DashboardSkeleton } from "../ui/Skeleton";

export default function TalentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUserData(user?.id);
  const { isOnline, networkStatus } = useNetworkStatus();
  const [matches, setMatches] = useState<any[]>([]);
  const [excellentMatchCount, setExcellentMatchCount] = useState(0);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [analytics, setAnalytics] = useState<TalentAnalytics | null>(null);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const talent = data?.talent;
  const profile = data?.profile;

  const loadDashboardData = useCallback(async (isRetry = false) => {
    if (!user || !talent) {
      setIsDashboardLoading(true);
      return;
    }

    // Don't attempt to load if offline
    if (!navigator.onLine) {
      setLoadError('You are currently offline. Data will refresh when you reconnect.');
      setIsDashboardLoading(false);
      return;
    }

    setIsDashboardLoading(true);
    setLoadError(null);
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }

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

      // Fetch real matches
      let allMatches: any[] = [];
      try {
        const matchResponse = await fetch(`http://localhost:8000/api/v1/matching/talent/${talent.id}/jobs?limit=10`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (matchResponse.ok) {
          const matchingResults = await matchResponse.json();
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
        if (matchesResult.data && matchesResult.data.length > 0) {
          allMatches = matchesResult.data.map((m: any) => ({
            ...m,
            matchScore: m.match_score || 0,
          }));
        }
      }

      allMatches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setMatches(allMatches.slice(0, 3));

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
        setAnalytics({ profileViews: 0, applications: 0, matches: allMatches.length, messages: 0 });
      }

      if (jobsResult.data) {
        setAllJobs(jobsResult.data);
      }
    } catch (error: any) {
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network') || !navigator.onLine;

      if (isNetworkError) {
        setLoadError('Connection issue. Please check your network and try again.');
        // Don't show notification for network errors - the UI handles it
      } else {
        setLoadError('Failed to load dashboard data. Please try again.');
        notify.showError("Failed to load dashboard data");
      }
    } finally {
      setIsDashboardLoading(false);
      setRetryCount(0);
    }
  }, [user, talent]);

  // Retry when coming back online
  useEffect(() => {
    if (isOnline && loadError) {
      console.log('Network restored, retrying dashboard load...');
      loadDashboardData(true);
    }
  }, [isOnline, loadError, loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-50 text-amber-600 border-amber-100",
      reviewed: "bg-blue-50 text-blue-600 border-blue-100",
      interview: "bg-purple-50 text-purple-600 border-purple-100",
      offer: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-600 border-red-100",
    };
    const style = styles[status as keyof typeof styles] || "bg-slate-50 text-slate-500 border-slate-100";
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold border ${style}`}>
        {status}
      </span>
    );
  };

  // Show skeleton loading
  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error || loadError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiX size={32} className="text-amber-600" weight="duotone" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {!isOnline ? "You're Offline" : 'Unable to Load Dashboard'}
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {loadError || (error as any)?.message || "Please check your connection and try again."}
          </p>
          <button
            onClick={() => loadDashboardData(true)}
            disabled={!isOnline || isDashboardLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <ArrowClockwise size={18} className={retryCount > 0 ? 'animate-spin' : ''} />
            {retryCount > 0 ? 'Retrying...' : 'Try Again'}
          </button>
          {!isOnline && (
            <p className="text-xs text-slate-400 mt-4">
              We'll automatically retry when you're back online
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">

      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                  {profile?.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Hello, {profile?.full_name?.split(' ')[0]}
                </h1>
                <p className="text-sm text-slate-500">
                  Ready for new opportunities?
                </p>
              </div>
            </div>

            <Link
              to="/talent/jobs"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 self-start md:self-auto"
            >
              Browse Jobs
            </Link>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Profile Views", value: analytics?.profileViews || 0, suffix: "this week" },
            { label: "Applications", value: analytics?.applications || 0, suffix: "active" },
            { label: "Job Matches", value: analytics?.matches || 0, suffix: "new" },
            { label: "Response Rate", value: "24%", suffix: "average" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-xs text-slate-400 font-medium">{stat.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Main Column */}
          <div className="flex-1 w-full space-y-10">

            {/* Top Matches Section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="text-blue-600" weight="fill" />
                  Top Job Matches
                </h2>
              </div>

              {/* Matches Grid - Adjusted Compact Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {matches.length > 0 ? matches.map((match) => (
                  <div key={match.id} className="h-full">
                    <JobCard
                      job={match.job}
                      matchScore={match.matchScore}
                    />
                  </div>
                )) : (
                  <div className="col-span-2 py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No matches yet. Complete your profile!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recommended Jobs */}
            <section>
              <div className="flex items-center justify-between mb-5 pt-4 border-t border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mt-4">New Opportunities</h2>
                <Link to="/talent/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 mt-4">
                  See All
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-1">
                <JobList jobs={allJobs} showSearch={false} />
              </div>
            </section>
          </div>

          {/* Right Sidebar - Clearly Separated */}
          <div className="w-full lg:w-[350px] flex-shrink-0 space-y-8">

            {/* Recent Applications Widget */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Recent Activity</h3>
                <Link to="/talent/applications" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
              </div>

              <div className="p-2">
                {applications.length > 0 ? applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                    onClick={() => navigate(`/jobs/${app.job?.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {app.job?.companies?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600">{app.job?.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{app.job?.companies?.name}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pl-12">
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <CalendarBlank /> {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300">
                      <Briefcase size={20} />
                    </div>
                    <p className="text-sm text-slate-400">No applications yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completion - Blue Theme */}
            {profile && (
              <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />

                <h3 className="font-bold text-lg mb-1 relative z-10">Profile Strength</h3>
                <p className="text-blue-100 text-xs mb-5 relative z-10 max-w-[80%]">Complete your profile to unlock full visibility.</p>

                <div className="flex items-end justify-between mb-2 relative z-10">
                  <span className="text-4xl font-bold tracking-tight">85%</span>
                  <Link
                    to="/talent-profile"
                    className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Improve Profile
                  </Link>
                </div>

                <div className="w-full bg-black/20 rounded-full h-1.5 relative z-10">
                  <div className="bg-white h-1.5 rounded-full w-[85%]" />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

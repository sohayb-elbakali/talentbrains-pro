import {
  Briefcase,
  CheckCircle,
  CalendarBlank,
  WifiX,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { useNetworkStatus } from "../../hooks/useNetworkResilience";
import { useTalentDashboardData } from "../../hooks/useDashboardData";
import JobList from "../jobs/JobList";
import { JobCard } from "../jobs/JobCard";
import { DashboardSkeleton } from "../ui/Skeleton";

export default function TalentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userData, isLoading: userLoading } = useUserData(user?.id);
  const { isOnline } = useNetworkStatus();

  const talent = userData?.talent;
  const profile = userData?.profile;

  // Use React Query hook for cached data - this persists across tab switches!
  const {
    applications,
    matches,
    analytics,
    jobs: allJobs,
    isInitialLoading,
    error: dashboardError,
  } = useTalentDashboardData(user?.id, talent?.id);

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

  // Show skeleton ONLY on initial load (no cached data)
  if (userLoading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (dashboardError) {
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
            {!isOnline
              ? 'Please check your internet connection.'
              : 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            disabled={!isOnline}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <ArrowClockwise size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Format matches for display (top 3 by score)
  const topMatches = (matches || [])
    .map((m: any) => ({
      id: m.id || `match-${m.job_id}`,
      matchScore: m.match_score || m.matchScore || 0,
      job: m.job || {
        id: m.job_id,
        title: m.job_title || 'Position',
        location: m.location,
        companies: { name: m.company || 'Company' },
      },
    }))
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, 3);

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
            { label: "Applications", value: analytics?.applications || applications?.length || 0, suffix: "active" },
            { label: "Job Matches", value: analytics?.matches || topMatches?.length || 0, suffix: "new" },
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

              {/* Matches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {topMatches.length > 0 ? topMatches.map((match: any) => (
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
                <JobList jobs={allJobs || []} showSearch={false} />
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[350px] flex-shrink-0 space-y-8">

            {/* Recent Applications Widget */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Recent Activity</h3>
                <Link to="/talent/applications" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
              </div>

              <div className="p-2">
                {applications && applications.length > 0 ? applications.map((app: any) => (
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
                        <CalendarBlank /> {new Date(app.applied_at || app.appliedAt).toLocaleDateString()}
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

            {/* Profile Completion */}
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

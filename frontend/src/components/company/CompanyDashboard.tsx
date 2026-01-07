import { Briefcase, Plus, Users, TrendingUp, Eye, Clock, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import ModernJobCard from "./ModernJobCard";
import LoadingSpinner from "../ui/LoadingSpinner";

const CompanyDashboard = () => {
  const { profile, user } = useAuth();
  const { data: userData } = useUserData(user?.id);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const companyName = userData?.company?.name || 'Company';

  useEffect(() => {
    if (!profile?.id) return;

    const getCompanyId = async () => {
      const { data: companyData } = await db.getCompany(profile.id);
      if (companyData) {
        setCompanyId(companyData.id);
      }
    };

    getCompanyId();
  }, [profile?.id]);

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getJobs({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['company-applications', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getApplications({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loading = jobsLoading || appsLoading || !companyId;
  const activeJobs = loading ? undefined : (jobsData?.filter((job: any) => job.status === "active").length || 0);
  const totalApplicants = loading ? undefined : (applicationsData?.length || 0);
  const pendingApplicants = loading ? undefined : (applicationsData?.filter((app: any) => app.status === "pending").length || 0);
  const recentJobs = jobsData?.filter((job: any) => job.status === "active").slice(0, 6) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">

      {/* Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Company Logo"
                  className="w-14 h-14 rounded-xl object-cover border-2 border-blue-100 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {companyName?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {companyName}
                </h1>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <Target size={14} />
                  Recruitment Dashboard
                </p>
              </div>
            </div>

            <Link
              to="/company/jobs/create"
              className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 self-start md:self-auto flex items-center gap-2 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              Post New Job
            </Link>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Simplified Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Active Jobs Card */}
          <Link to="/company/jobs" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <Briefcase size={20} className="text-blue-600" />
                </div>
                <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  ACTIVE
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900">{activeJobs}</p>
                <p className="text-sm font-medium text-slate-500">Job Postings</p>
              </div>
            </div>
          </Link>

          {/* Total Applicants Card */}
          <Link to="/company/applicants" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-purple-50 rounded-lg">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  TOTAL
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900">{totalApplicants}</p>
                <p className="text-sm font-medium text-slate-500">Applicants</p>
              </div>
            </div>
          </Link>

          {/* Pending Reviews Card */}
          <Link to="/company/applicants?status=pending" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <Clock size={20} className="text-amber-600" />
                </div>
                {pendingApplicants && pendingApplicants > 0 && (
                  <div className="text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
                    NEW
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900">{pendingApplicants}</p>
                <p className="text-sm font-medium text-slate-500">Pending Review</p>
              </div>
            </div>
          </Link>

          {/* AI Matches Card */}
          <Link to="/company/matches" className="group">
            <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  AI
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900">Smart</p>
                <p className="text-sm font-medium text-slate-500">AI Matching</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/company/jobs" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors group flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">Manage Jobs</h3>
                <p className="text-xs text-slate-500">Edit & track postings</p>
              </div>
            </Link>

            <Link to="/company/applicants" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-200 transition-colors group flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">Review Candidates</h3>
                <p className="text-xs text-slate-500">Screen applications</p>
              </div>
            </Link>

            <Link to="/company/analytics" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors group flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Eye size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">View Analytics</h3>
                <p className="text-xs text-slate-500">Performance insights</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Jobs Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Job Postings</h2>
              <p className="text-sm text-slate-500 mt-1">Your latest active positions</p>
            </div>
            <Link to="/company/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              View All
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {recentJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentJobs.map((job: any) => (
                <ModernJobCard
                  key={job.id}
                  job={job}
                  showCompany={false}
                  showStats={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:border-blue-300 transition-colors">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={36} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No jobs posted yet
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Start attracting top talent by posting your first job opening.
              </p>
              <Link
                to="/company/jobs/create"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5"
              >
                <Plus size={22} className="mr-2" />
                Post Your First Job
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CompanyDashboard;

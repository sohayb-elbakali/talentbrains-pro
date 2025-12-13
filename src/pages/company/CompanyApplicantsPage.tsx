import { motion } from 'framer-motion';
import { Briefcase, Calendar, CheckCircle, Clock, Eye, Funnel, MapPin, MagnifyingGlass, User, XCircle, Star, TrendUp, ChartBar } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";
import { CardSkeleton, StatsSkeleton } from "../../components/SkeletonLoader";
import { useFilterStore } from "../../stores/filterStore";

interface Application {
  id: string;
  status: "pending" | "reviewed" | "interview" | "offer" | "accepted" | "rejected" | "withdrawn";
  applied_at: string;
  job: {
    id: string;
    title: string;
  };
  talent: {
    id: string;
    profile_id: string;
    title: string;
    bio: string;
    experience_level: string;
    location: string;
    availability_status: string;
    profile: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string | null;
    };
  };
}

const CompanyApplicantsPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Zustand for filters
  const { applicationFilters, setApplicationFilters, resetApplicationFilters } = useFilterStore();

  const fetchApplicants = useCallback(async () => {
    if (!profile?.id) return;

    const cacheKey = `applicants-${profile.id}-${searchParams.get("job") || 'all'}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const age = Date.now() - cachedData.timestamp;
        if (age < 3 * 60 * 1000) {
          setApplications(cachedData.data);
          setFilteredApplications(cachedData.data);
          setLoading(false);
          return;
        }
      } catch {
        // Invalid cache, continue with fetch
      }
    }

    try {
      setLoading(true);
      const { data: companyData, error: companyError } = await db.getCompany(profile.id);
      if (companyError || !companyData) {
        setError("Company profile not found. Please complete your company profile first.");
        return;
      }

      const jobId = searchParams.get("job");
      const filters: any = { company_id: companyData.id };
      if (jobId) filters.job_id = jobId;

      const { data, error } = await db.getApplications(filters);
      if (error) throw error;

      const applicationsData = data || [];
      setApplications(applicationsData);
      setFilteredApplications(applicationsData);

      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: applicationsData,
        timestamp: Date.now()
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, searchParams]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Filter applications based on Zustand filters
  useEffect(() => {
    let filtered = [...applications];

    // Search filter
    if (applicationFilters.search) {
      const search = applicationFilters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.talent?.profile?.full_name?.toLowerCase().includes(search) ||
          app.talent?.title?.toLowerCase().includes(search) ||
          app.job?.title?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (applicationFilters.status.length > 0) {
      filtered = filtered.filter((app) =>
        applicationFilters.status.includes(app.status)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (applicationFilters.sortBy) {
        case 'recent':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'oldest':
          return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, applicationFilters]);

  const getStatusConfig = (status: Application["status"]) => {
    const configs = {
      pending: {
        icon: Clock,
        class: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Pending Review",
        bgClass: "bg-orange-50 border-orange-200"
      },
      reviewed: {
        icon: Eye,
        class: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Reviewed",
        bgClass: "bg-blue-50 border-blue-200"
      },
      interview: {
        icon: Star,
        class: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Interview Scheduled",
        bgClass: "bg-orange-50 border-orange-200"
      },
      offer: {
        icon: Star,
        class: "bg-green-100 text-green-700 border-green-200",
        label: "Offer Extended",
        bgClass: "bg-green-50 border-green-200"
      },
      accepted: {
        icon: CheckCircle,
        class: "bg-green-100 text-green-700 border-green-200",
        label: "Accepted",
        bgClass: "bg-green-50 border-green-200"
      },
      rejected: {
        icon: XCircle,
        class: "bg-red-100 text-red-700 border-red-200",
        label: "Rejected",
        bgClass: "bg-red-50 border-red-200"
      },
      withdrawn: {
        icon: XCircle,
        class: "bg-slate-100 text-slate-700 border-slate-200",
        label: "Withdrawn",
        bgClass: "bg-slate-50 border-slate-200"
      },
    };

    return configs[status] || configs.pending;
  };

  const stats = [
    { label: "Total Applications", value: applications.length, color: "bg-primary text-white", icon: ChartBar },
    { label: "Pending Review", value: applications.filter(a => a.status === "pending").length, color: "bg-orange-100 text-orange-700 border border-orange-200", icon: Clock },
    { label: "Interviews", value: applications.filter(a => a.status === "interview").length, color: "bg-blue-100 text-blue-700 border border-blue-200", icon: Calendar },
    { label: "Offers/Accepted", value: applications.filter(a => ["offer", "accepted"].includes(a.status)).length, color: "bg-green-100 text-green-700 border border-green-200", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Applicant <span className="text-primary">Management</span>
          </h1>
          <p className="text-lg text-slate-600">Review and manage your job applications</p>
        </motion.div>

        <div className="mb-8">
          <div className="relative">
            <MagnifyingGlass weight="regular" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, job title, or skills..."
              value={applicationFilters.search}
              onChange={(e) => setApplicationFilters({ search: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary transition-all outline-none text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Funnel size={20} weight="regular" className="text-slate-600" />
            <h3 className="font-semibold text-slate-700">Quick Filters</h3>
            {applicationFilters.status.length > 0 && (
              <button
                onClick={resetApplicationFilters}
                className="ml-auto text-sm text-primary hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* All */}
            <button
              onClick={() => setApplicationFilters({ status: [] })}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${applicationFilters.status.length === 0
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
            >
              All ({applications.length})
            </button>

            {/* Status Filters with Counts */}
            {[
              { value: 'pending', label: 'Pending', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
              { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
              { value: 'interview', label: 'Interview', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
              { value: 'offer', label: 'Offer', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
              { value: 'accepted', label: 'Accepted', color: 'bg-green-600', hoverColor: 'hover:bg-green-700' },
              { value: 'rejected', label: 'Rejected', color: 'bg-red-500', hoverColor: 'hover:bg-red-600' },
            ].map((status) => {
              const count = applications.filter(a => a.status === status.value).length;
              const isActive = applicationFilters.status.includes(status.value as any);

              return (
                <button
                  key={status.value}
                  onClick={() => {
                    const newStatuses = isActive
                      ? applicationFilters.status.filter(s => s !== status.value)
                      : [...applicationFilters.status, status.value as any];
                    setApplicationFilters({ status: newStatuses });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive
                    ? `${status.color} text-white ${status.hoverColor}`
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                  {status.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendUp size={16} weight="regular" className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Sort by:</span>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'recent', label: 'Most Recent' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'status', label: 'Status' },
              ].map((sort) => (
                <button
                  key={sort.value}
                  onClick={() => setApplicationFilters({ sortBy: sort.value as any })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${applicationFilters.sortBy === sort.value
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200`}
              >
                <div className={`inline-flex p-3 rounded-xl ${stat.color} mb-4`}>
                  <Icon size={24} weight="regular" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-600">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {loading ? (
          <>
            <StatsSkeleton count={4} />
            <div className="mt-8">
              <CardSkeleton count={6} />
            </div>
          </>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-12 text-center">
            <XCircle size={64} weight="regular" className="text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <User size={64} weight="regular" className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No applicants found</h3>
            <p className="text-slate-500 text-lg">
              {applicationFilters.search || applicationFilters.status.length > 0
                ? "Try adjusting your filters to see more results"
                : "Applications will appear here once candidates apply to your jobs"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app, index) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => navigate(`/company/applicants/${app.id}`)}
                  className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary transition-all duration-200"
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-1">
                    <div className={`px-3 py-1.5 ${statusConfig.class} rounded-lg border text-xs font-semibold flex items-center gap-1.5`}>
                      <StatusIcon size={14} weight="regular" />
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={app.talent?.profile?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${app.talent?.profile?.full_name}`}
                        alt={app.talent?.profile?.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                          {app.talent?.profile?.full_name}
                        </h3>
                        <p className="text-sm text-slate-600 truncate">{app.talent?.title}</p>
                      </div>
                    </div>

                    {/* Details with Icons */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                          <Briefcase size={14} weight="regular" className="text-primary" />
                        </div>
                        <span className="truncate">{app.job.title}</span>
                      </div>
                      {app.talent?.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <MapPin size={14} weight="regular" className="text-primary" />
                          </div>
                          <span className="truncate">{app.talent.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} weight="regular" />
                        <span>Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/company/applicants/${app.id}`);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Eye size={16} weight="regular" />
                      View Profile
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyApplicantsPage;

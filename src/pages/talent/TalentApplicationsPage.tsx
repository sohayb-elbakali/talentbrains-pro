import { motion } from 'framer-motion';
import { Briefcase, Calendar, CheckCircle, Clock, Eye, Filter, MapPin, Search, XCircle, TrendingUp, DollarSign, X, Star } from 'lucide-react';
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";
import { useRealtimeQuery } from "../../hooks/useRealtimeQuery";
import { notify } from "../../utils/notify";
import { CardSkeleton, StatsSkeleton } from "../../components/SkeletonLoader";
import { useFilterStore } from "../../stores/filterStore";


interface Application {
  id: string;
  status: "pending" | "reviewed" | "interview" | "offer" | "accepted" | "rejected" | "withdrawn";
  applied_at: string;
  job: {
    id: string;
    title: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    companies: {
      name: string;
    };
  };
}

const TalentApplicationsPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Use Zustand for filters
  const { applicationFilters, setApplicationFilters, resetApplicationFilters } = useFilterStore();

  // Fetch talent ID first (cached for 10 minutes)
  const { data: talentData } = useRealtimeQuery({
    queryKey: ['talent', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await db.getTalent(profile.id);
      return data;
    },
    enabled: !!profile?.id,
    staleTime: 10 * 60 * 1000,
    table: 'talents',
    filter: `profile_id=eq.${profile?.id}`,
  });

  // Fetch applications with real-time updates (already includes company avatars)
  const { data: applications = [], isLoading: loading, error } = useRealtimeQuery({
    queryKey: ['applications-v2', talentData?.id],
    queryFn: async () => {
      if (!talentData?.id) return [];
      const { data, error } = await db.getApplications({ talent_id: talentData.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talentData?.id,
    staleTime: 3 * 60 * 1000,
    table: 'applications',
    filter: `talent_id=eq.${talentData?.id}`,
  });

  // Filter applications based on Zustand filters
  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    // Search filter
    if (applicationFilters.search) {
      const search = applicationFilters.search.toLowerCase();
      filtered = filtered.filter(
        (app: Application) =>
          app.job?.title?.toLowerCase().includes(search) ||
          app.job?.companies?.name?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (applicationFilters.status.length > 0) {
      filtered = filtered.filter((app: Application) =>
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

    return filtered;
  }, [applications, applicationFilters]);

  const getStatusConfig = (status: Application["status"]) => {
    const configs = {
      pending: {
        icon: Clock,
        class: "bg-gradient-to-r from-yellow-400 to-orange-400 text-white",
        label: "Pending Review",
        bgClass: "bg-yellow-50 border-yellow-200"
      },
      reviewed: {
        icon: Eye,
        class: "bg-gradient-to-r from-blue-400 to-cyan-400 text-white",
        label: "Reviewed",
        bgClass: "bg-blue-50 border-blue-200"
      },
      interview: {
        icon: Star,
        class: "bg-gradient-to-r from-secondary to-secondary-hover text-white",
        label: "Interview Scheduled",
        bgClass: "bg-orange-50 border-orange-200"
      },
      offer: {
        icon: CheckCircle,
        class: "bg-gradient-to-r from-green-400 to-emerald-400 text-white",
        label: "Offer Received",
        bgClass: "bg-green-50 border-green-200"
      },
      accepted: {
        icon: CheckCircle,
        class: "bg-gradient-to-r from-green-500 to-teal-500 text-white",
        label: "Accepted",
        bgClass: "bg-green-50 border-green-200"
      },
      rejected: {
        icon: XCircle,
        class: "bg-gradient-to-r from-red-400 to-pink-400 text-white",
        label: "Not Selected",
        bgClass: "bg-red-50 border-red-200"
      },
      withdrawn: {
        icon: XCircle,
        class: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
        label: "Withdrawn",
        bgClass: "bg-gray-50 border-gray-200"
      },
    };

    return configs[status] || configs.pending;
  };

  const handleWithdraw = async (applicationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      return;
    }

    setWithdrawingId(applicationId);
    try {
      const { error } = await db.updateApplication(applicationId, { status: "withdrawn" });
      if (error) throw error;
      notify.showSuccess("Application withdrawn successfully");
    } catch (err: any) {
      notify.showError(err.message || "Failed to withdraw application");
    } finally {
      setWithdrawingId(null);
    }
  };

  const stats = [
    { label: "Total Applications", value: applications.length, color: "from-primary to-primary-hover", icon: TrendingUp },
    { label: "Pending", value: applications.filter((a: Application) => a.status === "pending").length, color: "from-yellow-500 to-orange-500", icon: Clock },
    { label: "Interviews", value: applications.filter((a: Application) => a.status === "interview").length, color: "from-secondary to-secondary-hover", icon: Calendar },
    { label: "Offers", value: applications.filter((a: Application) => ["offer", "accepted"].includes(a.status)).length, color: "from-green-500 to-emerald-500", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-3">
            My Applications
          </h1>
          <p className="text-lg text-gray-600">Track your job applications and their status</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={applicationFilters.search}
              onChange={(e) => setApplicationFilters({ search: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary-light transition-all outline-none text-gray-900 placeholder-gray-400 shadow-sm hover:border-gray-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} px-6 py-4 shadow-md`}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-8 space-y-6"
          >
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
                  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
                  { value: 'interview', label: 'Interview', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
                  { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
                  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
                  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      const newStatuses = applicationFilters.status.includes(status.value as Application["status"])
                        ? applicationFilters.status.filter(s => s !== status.value)
                        : [...applicationFilters.status, status.value as Application["status"]];
                      setApplicationFilters({ status: newStatuses });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${applicationFilters.status.includes(status.value as Application["status"])
                      ? status.color + ' ring-2 ring-offset-2 ring-primary'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {status.label}
                    {applicationFilters.status.includes(status.value as Application["status"]) && (
                      <span className="ml-2">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Sort By</label>
              <div className="flex gap-2">
                {[
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'status', label: 'Status' },
                ].map((sort) => (
                  <button
                    key={sort.value}
                    onClick={() => setApplicationFilters({ sortBy: sort.value as any })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${applicationFilters.sortBy === sort.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={resetApplicationFilters}
                className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`}></div>
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                </div>
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
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-12 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{(error as any)?.message || 'An error occurred'}</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500 text-lg mb-6">
              {applicationFilters.search || applicationFilters.status.length > 0
                ? "Try adjusting your filters"
                : "Start applying to jobs to see them here"}
            </p>
            <button
              onClick={() => navigate('/talent/jobs')}
              className="btn btn-primary"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app: Application, index: number) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/jobs/${app.job.id}`)}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-1">
                    <div className={`p-2 ${statusConfig.class} rounded-full shadow-md`}>
                      <StatusIcon size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-full shadow-sm">
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Company Logo & Job Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center overflow-hidden p-3 shadow-sm">
                        {app.job.companies?.avatar_url ? (
                          <img
                            src={app.job.companies.avatar_url}
                            alt={app.job.companies.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Briefcase className="h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-12">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {app.job.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium truncate">{app.job.companies.name}</p>
                      </div>
                    </div>

                    {/* Details with Icons */}
                    <div className="space-y-2 mb-4">
                      {app.job.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="truncate">{app.job.location}</span>
                        </div>
                      )}
                      {app.job.salary_min && app.job.salary_max && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <span className="font-semibold text-green-700">${app.job.salary_min.toLocaleString()} - ${app.job.salary_max.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${app.job.id}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      {app.status !== "withdrawn" && app.status !== "rejected" && app.status !== "accepted" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(app.id, e);
                          }}
                          disabled={withdrawingId === app.id}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Withdraw application"
                        >
                          {withdrawingId === app.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      )}
                    </div>
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

export default TalentApplicationsPage;

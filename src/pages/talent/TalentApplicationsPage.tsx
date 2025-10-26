import { motion } from 'framer-motion';
import { Briefcase, Calendar, CheckCircle, Clock, Eye, Filter, MapPin, Search, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";
import CompanyLogo from "../../components/CompanyLogo";
import { useRealtimeQuery } from "../../hooks/useRealtimeQuery";

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
      logo_url?: string;
    };
  };
}

const TalentApplicationsPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // Fetch applications with real-time updates
  const { data: applications = [], isLoading: loading, error } = useRealtimeQuery({
    queryKey: ['applications', talentData?.id],
    queryFn: async () => {
      if (!talentData?.id) return [];
      const { data, error } = await db.getApplications({ talent_id: talentData.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talentData?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer since we have real-time
    table: 'applications',
    filter: `talent_id=eq.${talentData?.id}`,
  });

  // Filter applications based on search and status
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (app: Application) =>
          app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job?.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app: Application) => app.status === statusFilter);
    }

    return filtered;
  }, [applications, searchTerm, statusFilter]);

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
        icon: Calendar, 
        class: "bg-gradient-to-r from-purple-400 to-pink-400 text-white", 
        label: "Interview Scheduled",
        bgClass: "bg-purple-50 border-purple-200"
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

  const stats = [
    { label: "Total Applications", value: applications.length, color: "from-purple-500 to-blue-500", icon: TrendingUp },
    { label: "Pending", value: applications.filter((a: Application) => a.status === "pending").length, color: "from-yellow-500 to-orange-500", icon: Clock },
    { label: "Interviews", value: applications.filter((a: Application) => a.status === "interview").length, color: "from-purple-500 to-pink-500", icon: Calendar },
    { label: "Offers", value: applications.filter((a: Application) => ["offer", "accepted"].includes(a.status)).length, color: "from-green-500 to-emerald-500", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-900 placeholder-gray-400 shadow-sm"
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
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-8"
          >
            <label className="label">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Not Selected</option>
            </select>
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
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading applications...</p>
          </div>
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
              {searchTerm || statusFilter !== "all" 
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
          <div className="space-y-6">
            {filteredApplications.map((app: Application, index: number) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/jobs/${app.job.id}`)}
                  className={`group relative bg-white rounded-2xl shadow-lg border-2 ${statusConfig.bgClass} p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-blue-100 opacity-0 group-hover:opacity-20 rounded-full -mr-32 -mt-32 transition-opacity duration-300"></div>
                  
                  <div className="relative flex flex-col sm:flex-row items-start gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg ring-2 ring-purple-100 overflow-hidden">
                        <CompanyLogo
                          avatarUrl={app.job?.companies?.logo_url}
                          companyName={app.job?.companies?.name || 'Company'}
                          size="xl"
                          className="w-full h-full"
                        />
                      </div>
                      <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl ${statusConfig.class} shadow-lg`}>
                        <StatusIcon size={16} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                            {app.job.title}
                          </h3>
                          <p className="text-base text-gray-600 font-medium">{app.job.companies.name}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-xl ${statusConfig.class} text-sm font-bold shadow-md whitespace-nowrap flex items-center gap-2`}>
                          <StatusIcon size={16} />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        {app.job.location && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                            <MapPin size={16} className="text-blue-500" />
                            <span>{app.job.location}</span>
                          </div>
                        )}
                        {app.job.salary_min && app.job.salary_max && (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                            <DollarSign size={16} className="text-green-500" />
                            <span>${app.job.salary_min.toLocaleString()} - ${app.job.salary_max.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Calendar size={16} className="text-purple-500" />
                          <span>Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Click to view job details
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${app.job.id}`);
                          }}
                          className="btn btn-primary shadow-lg hover:shadow-xl"
                        >
                          <Eye size={18} />
                          View Job
                        </button>
                      </div>
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

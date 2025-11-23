import { motion } from "framer-motion";
import {
  Briefcase, Building, DollarSign, MapPin, Clock, CheckCircle,
  XCircle, Eye, ArrowRight, Star
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import CompanyLogo from "./CompanyLogo";

export interface Job {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  job_type?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  avatar_url?: string | null;
  description?: string;
  requirements?: string;
  benefits?: string[];
  required_skills?: string[];
}

interface JobCardProps {
  job: Job;
  linkTo?: string;
  application?: any | null;
  onApply?: (job: Job) => void;
  onCancel?: (applicationId: string) => void;
  actionLoading?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  linkTo,
  application,
  onCancel,
  actionLoading,
}) => {

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      if (job.salary_min === job.salary_max)
        return `${job.salary_min.toLocaleString()}`;
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
    }
    return `${(job.salary_min || job.salary_max)?.toLocaleString()}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { icon: Clock, color: "from-yellow-400 to-orange-400", label: "Pending", progress: 25 },
      reviewed: { icon: Eye, color: "from-blue-400 to-cyan-400", label: "Reviewed", progress: 50 },
      interview: { icon: Star, color: "from-secondary to-secondary-hover", label: "Interview", progress: 75 },
      offer: { icon: CheckCircle, color: "from-green-400 to-emerald-400", label: "Offer", progress: 90 },
      accepted: { icon: CheckCircle, color: "from-green-500 to-teal-500", label: "Accepted", progress: 100 },
      rejected: { icon: XCircle, color: "from-red-400 to-pink-400", label: "Not Selected", progress: 100 },
      withdrawn: { icon: XCircle, color: "from-gray-400 to-gray-500", label: "Withdrawn", progress: 100 },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = application ? getStatusConfig(application.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <Link to={linkTo || `/jobs/${job.id}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col hover:shadow-xl hover:border-primary transition-all duration-300"
      >
        <div className="absolute inset-0 bg-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        {application && statusConfig && StatusIcon && (
          <div className={`absolute top-4 right-4 px-4 py-2 bg-gradient-to-r ${statusConfig.color} text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 z-10 backdrop-blur-sm`}>
            <StatusIcon size={14} className="animate-pulse" />
            {statusConfig.label}
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col relative z-10">
          <div className="flex items-start gap-4 mb-5">
            <div className="relative flex-shrink-0 group/logo">
              <div className="absolute inset-0 bg-primary rounded-2xl blur-md opacity-20 group-hover/logo:opacity-40 transition-opacity duration-300"></div>
              <div className="relative transform group-hover/logo:scale-105 transition-transform duration-300">
                <CompanyLogo
                  avatarUrl={job.avatar_url}
                  companyName={job.company_name}
                  size="lg"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary flex items-center mb-1.5 uppercase tracking-wider">
                <Building size={12} className="mr-1.5" />
                {job.company_name}
              </p>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-all line-clamp-2 leading-tight">
                {job.title}
              </h3>
            </div>
          </div>

          <div className="space-y-2.5 mb-5 flex-1">
            {job.location && (
              <div className="flex items-center gap-3 text-sm text-gray-700 group/item hover:text-primary transition-colors">
                <div className="p-2.5 bg-blue-50 rounded-xl group-hover/item:bg-blue-100 transition-all shadow-sm">
                  <MapPin size={15} className="text-primary" />
                </div>
                <span className="font-semibold">{job.location}</span>
              </div>
            )}
            {(job.job_type || job.employment_type) && (
              <div className="flex items-center gap-3 text-sm text-gray-700 group/item hover:text-blue-600 transition-colors">
                <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover/item:from-blue-100 group-hover/item:to-blue-200 transition-all shadow-sm">
                  <Briefcase size={15} className="text-blue-600" />
                </div>
                <span className="font-semibold capitalize">{(job.job_type || job.employment_type)?.replace(/_/g, ' ')}</span>
              </div>
            )}
            {formatSalary() && (
              <div className="flex items-center gap-3 text-sm group/item">
                <div className="p-2.5 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl group-hover/item:from-green-100 group-hover/item:to-emerald-200 transition-all shadow-sm">
                  <DollarSign size={15} className="text-green-600" />
                </div>
                <span className="font-bold text-green-700 text-base">${formatSalary()}</span>
              </div>
            )}
          </div>

          {/* Skills Section */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Required Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-primary rounded-lg text-xs font-semibold border border-blue-100 transition-all hover:scale-105">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 5 && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                    +{job.required_skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {application && statusConfig ? (
            <div className="space-y-3 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  Application Progress
                </span>
                <span className="text-sm font-bold text-primary">{statusConfig.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${statusConfig.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-3 bg-gradient-to-r ${statusConfig.color} shadow-lg relative`}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </motion.div>
              </div>
              {(application.status === "pending" || application.status === "reviewed" || application.status === "interview") && onCancel && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel(application.id);
                  }}
                  disabled={actionLoading}
                  className="w-full text-xs text-red-600 hover:text-white font-bold disabled:opacity-50 px-4 py-2.5 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-xl transition-all border-2 border-red-200 hover:border-red-500 hover:shadow-lg"
                >
                  {actionLoading ? "Processing..." : "Withdraw Application"}
                </button>
              )}
            </div>
          ) : (
            <button className="w-full btn btn-primary group-hover:scale-105 group-hover:shadow-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <Eye size={16} />
              <span>View Details</span>
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

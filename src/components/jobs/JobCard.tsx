import { motion } from "framer-motion";
import {
  Briefcase, Buildings, CurrencyDollar, MapPin, Clock, CheckCircle,
  XCircle, Eye, ArrowRight
} from "@phosphor-icons/react";
import React from "react";
import { Link } from "react-router-dom";
import CompanyLogo from "../profile/CompanyLogo";

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
        return `$${job.salary_min.toLocaleString()}`;
      return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
    }
    return `$${(job.salary_min || job.salary_max)?.toLocaleString()}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      pending: { icon: Clock, color: "from-slate-400 to-slate-500", label: "Pending" },
      reviewed: { icon: Eye, color: "from-blue-500 to-cyan-500", label: "Reviewed" },
      interview: { icon: CheckCircle, color: "from-purple-500 to-pink-500", label: "Interview" },
      offer: { icon: CheckCircle, color: "from-green-500 to-emerald-500", label: "Offer" },
      accepted: { icon: CheckCircle, color: "from-green-500 to-emerald-500", label: "Accepted" },
      rejected: { icon: XCircle, color: "from-red-500 to-pink-500", label: "Not Selected" },
      withdrawn: { icon: XCircle, color: "from-gray-500 to-gray-600", label: "Withdrawn" },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = application ? getStatusConfig(application.status) : null;

  return (
    <Link to={linkTo || `/jobs/${job.id}`} className="block h-full group/card">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col hover:shadow-lg hover:border-primary transition-all duration-300"
      >
        {/* Top colored bar */}
        <div className="h-1 bg-primary"></div>

        {/* Status Badge */}
        {application && statusConfig && (
          <div className={`absolute top-5 right-4 px-2.5 py-1 bg-gradient-to-r ${statusConfig.color} text-white text-xs font-semibold rounded-full shadow-sm z-10 flex items-center gap-1`}>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            {statusConfig.label}
          </div>
        )}

        <div className="p-5 flex-1 flex flex-col">
          {/* Header with Logo and Title */}
          <div className="flex items-start gap-3 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-lg border border-gray-100 shadow-sm overflow-hidden bg-white group-hover/card:border-primary transition-colors">
                <CompanyLogo
                  avatarUrl={job.avatar_url}
                  companyName={job.company_name}
                  size="md"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-1 leading-snug group-hover/card:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Buildings size={12} weight="regular" />
                {job.company_name}
              </p>
            </div>
          </div>

          {/* Job Details - Compact */}
          <div className="space-y-2 mb-4 flex-1">
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} weight="regular" className="text-primary" />
                </div>
                <span className="font-medium truncate">{job.location}</span>
              </div>
            )}
            {(job.job_type || job.employment_type) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase size={14} weight="regular" className="text-blue-600" />
                </div>
                <span className="font-medium capitalize">{(job.job_type || job.employment_type)?.replace(/_/g, ' ')}</span>
              </div>
            )}
            {formatSalary() && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CurrencyDollar size={14} weight="regular" className="text-green-600" />
                </div>
                <span className="font-bold text-green-700">{formatSalary()}</span>
              </div>
            )}
          </div>

          {/* Skills - Compact */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                {job.required_skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-50 text-primary rounded-md text-xs font-medium border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium">
                    +{job.required_skills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto">
            {application && (application.status === "pending" || application.status === "reviewed" || application.status === "interview") && onCancel ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel(application.id);
                }}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 rounded-lg font-medium text-sm hover:bg-red-50 transition-all disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Withdraw Application"}
              </button>
            ) : !application && (
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md hover:bg-blue-700 transition-all group-hover/card:gap-3">
                <span>View Details</span>
                <ArrowRight size={16} weight="bold" className="transition-transform" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

import { motion } from "framer-motion";
import {
  Briefcase, Buildings, CurrencyDollar, MapPin, Clock, CheckCircle,
  XCircle, Eye, ArrowRight, Star
} from "@phosphor-icons/react";
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
      pending: { icon: Clock, color: "bg-slate-100 text-slate-700", label: "Pending", progress: 25 },
      reviewed: { icon: Eye, color: "bg-blue-100 text-blue-700", label: "Reviewed", progress: 50 },
      interview: { icon: Star, color: "bg-blue-100 text-blue-700", label: "Interview", progress: 75 },
      offer: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Offer", progress: 90 },
      accepted: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Accepted", progress: 100 },
      rejected: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Not Selected", progress: 100 },
      withdrawn: { icon: XCircle, color: "bg-slate-100 text-slate-600", label: "Withdrawn", progress: 100 },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = application ? getStatusConfig(application.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <Link to={linkTo || `/jobs/${job.id}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-md hover:border-primary transition-all duration-200"
      >
        {/* Status badge */}
        {application && statusConfig && StatusIcon && (
          <div className={`absolute top-4 right-4 px-3 py-1.5 ${statusConfig.color} text-xs font-medium rounded-full flex items-center gap-1.5 z-10`}>
            <StatusIcon size={16} weight="regular" />
            {statusConfig.label}
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          {/* Header with logo and company */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <CompanyLogo
                avatarUrl={job.avatar_url}
                companyName={job.company_name}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary flex items-center mb-1 uppercase tracking-wide">
                <Buildings size={16} weight="regular" className="mr-1.5" />
                {job.company_name}
              </p>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Job details */}
          <div className="space-y-3 mb-4 flex-1">
            {job.location && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <MapPin size={16} weight="regular" className="text-primary" />
                </div>
                <span className="font-medium">{job.location}</span>
              </div>
            )}
            {(job.job_type || job.employment_type) && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Briefcase size={16} weight="regular" className="text-primary" />
                </div>
                <span className="font-medium capitalize">{(job.job_type || job.employment_type)?.replace(/_/g, ' ')}</span>
              </div>
            )}
            {formatSalary() && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <CurrencyDollar size={16} weight="regular" className="text-green-600" />
                </div>
                <span className="font-semibold text-green-700">${formatSalary()}</span>
              </div>
            )}
          </div>

          {/* Skills Section */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} weight="regular" className="text-primary" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Required Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary"></span>
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 5 && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                    +{job.required_skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Application progress or action button */}
          {application && statusConfig ? (
            <div className="space-y-3 pt-4 border-t border-slate-200 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Application Progress
                </span>
                <span className="text-sm font-semibold text-primary">{statusConfig.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${statusConfig.progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-2 bg-primary rounded-full"
                />
              </div>
              {(application.status === "pending" || application.status === "reviewed" || application.status === "interview") && onCancel && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel(application.id);
                  }}
                  disabled={actionLoading}
                  className="w-full text-xs text-red-600 hover:text-white font-medium disabled:opacity-50 px-4 py-2 hover:bg-red-600 rounded-lg transition-colors border border-red-200 hover:border-red-600"
                >
                  {actionLoading ? "Processing..." : "Withdraw Application"}
                </button>
              )}
            </div>
          ) : (
            <button className="w-full btn btn-primary mt-4 flex items-center justify-center gap-2">
              <Eye size={20} weight="regular" />
              <span>View Details</span>
              <ArrowRight size={16} weight="regular" className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

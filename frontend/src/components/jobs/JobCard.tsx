import {
  Briefcase, CurrencyDollar, MapPin
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
  matchScore?: number;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  linkTo,
  application,
  onCancel,
  actionLoading,
  matchScore,
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
      pending: { color: "bg-amber-500", label: "Pending" },
      reviewed: { color: "bg-blue-500", label: "Reviewed" },
      interview: { color: "bg-purple-500", label: "Interview" },
      offer: { color: "bg-emerald-500", label: "Offer" },
      accepted: { color: "bg-emerald-600", label: "Accepted" },
      rejected: { color: "bg-red-500", label: "Not Selected" },
      withdrawn: { color: "bg-gray-500", label: "Withdrawn" },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = application ? getStatusConfig(application.status) : null;

  return (
    <Link to={linkTo || `/jobs/${job.id}`} className="block h-full">
      <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden h-full flex flex-col hover:border-blue-200 transition-colors duration-200">

        {/* Match Score Badge - Top Right Circle */}
        {matchScore !== undefined && matchScore > 0 && !application && (
          <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-green-500 text-white flex flex-col items-center justify-center z-10 shadow-sm">
            <span className="text-xs font-bold leading-none">{Math.round(matchScore)}%</span>
          </div>
        )}

        {/* Status Badge - Top Right */}
        {application && statusConfig && (
          <div className={`absolute top-3 right-3 px-2 py-0.5 ${statusConfig.color} text-white text-[10px] font-bold rounded z-10`}>
            {statusConfig.label}
          </div>
        )}

        <div className="p-5 flex-1 flex flex-col">
          {/* Company Logo & Title */}
          <div className="flex items-start gap-3 mb-4 pr-12">
            <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
              <CompanyLogo
                avatarUrl={job.avatar_url}
                companyName={job.company_name}
                size="sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight mb-1">
                {job.title}
              </h3>
              <p className="text-sm text-slate-500 truncate">
                {job.company_name}
              </p>
            </div>
          </div>

          {/* Job Info */}
          <div className="space-y-2 mb-4 flex-1">
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            )}
            {(job.job_type || job.employment_type) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase size={16} className="text-slate-400 flex-shrink-0" />
                <span className="capitalize">{(job.job_type || job.employment_type)?.replace(/_/g, ' ')}</span>
              </div>
            )}
            {formatSalary() && (
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <CurrencyDollar size={16} className="text-green-600 flex-shrink-0" />
                <span>{formatSalary()}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            {application && (application.status === "pending" || application.status === "reviewed" || application.status === "interview") && onCancel ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel(application.id);
                }}
                disabled={actionLoading}
                className="w-full py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Withdraw"}
              </button>
            ) : !application && (
              <div className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 transition-colors">
                View Details
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

import {
    Briefcase,
    Building,
    Calendar,
    DollarSign,
    Eye,
    MapPin,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import CompanyLogo from "../profile/CompanyLogo";

interface ModernJobCardProps {
    job: any;
    showCompany?: boolean;
    showStats?: boolean;
}

export default function ModernJobCard({
    job,
    showCompany = true,
    showStats = false,
}: ModernJobCardProps) {
    const formatSalary = () => {
        if (!job.salary_min && !job.salary_max) return null;
        if (job.salary_min && job.salary_max) {
            if (job.salary_min === job.salary_max)
                return `$${job.salary_min.toLocaleString()}`;
            return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
        }
        return `$${(job.salary_min || job.salary_max)?.toLocaleString()}`;
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            active: "bg-green-500",
            draft: "bg-amber-500",
            closed: "bg-slate-500",
            archived: "bg-red-500",
        };
        return colors[status] || "bg-blue-500";
    };

    const getStatusLabel = (status: string) => {
        const labels: any = {
            active: "Active",
            draft: "Draft",
            closed: "Closed",
            archived: "Archived",
        };
        return labels[status] || status;
    };

    return (
        <Link to={`/company/jobs/${job.id}`} className="block h-full group">
            <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 ease-out">

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-2 py-0.5 ${getStatusColor(job.status)} text-white text-[10px] font-bold rounded z-10`}>
                    {getStatusLabel(job.status)}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                    {/* Header with Logo and Title */}
                    <div className="flex items-start gap-3 mb-4 pr-12">
                        {showCompany && job.company_name && (
                            <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                    <CompanyLogo
                                        avatarUrl={job.avatar_url}
                                        companyName={job.company_name}
                                        size="md"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight mb-1">
                                {job.title}
                            </h3>
                            {showCompany && job.company_name && (
                                <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                                    <Building className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                    {job.company_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2 mb-4 flex-1">
                        {job.location && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{job.location}</span>
                            </div>
                        )}
                        {job.employment_type && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="capitalize">
                                    {job.employment_type.replace("_", " ")}
                                </span>
                            </div>
                        )}
                        {formatSalary() && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span>{formatSalary()}</span>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {job.required_skills && job.required_skills.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-slate-100">
                            <div className="flex flex-wrap gap-1.5">
                                {job.required_skills.slice(0, 3).map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {job.required_skills.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                        +{job.required_skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto">
                        {showStats ? (
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span className="font-medium">{job.views_count || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        <span className="font-medium">{job.applications_count || 0}</span>
                                    </div>
                                </div>
                                {job.created_at && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            job.created_at && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )
                        )}

                        {/* View Button */}
                        <button className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

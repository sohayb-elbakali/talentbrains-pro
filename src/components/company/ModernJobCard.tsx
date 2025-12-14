import { motion } from "framer-motion";
import {
    Briefcase,
    Building,
    Calendar,
    DollarSign,
    Eye,
    MapPin,
    Users,
    ArrowRight,
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
            active: "from-green-500 to-emerald-600",
            draft: "from-yellow-500 to-orange-500",
            closed: "from-gray-500 to-gray-600",
            archived: "from-red-500 to-pink-600",
        };
        return colors[status] || "from-blue-500 to-cyan-600";
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
        <Link to={`/company/jobs/${job.id}`} className="block h-full group/card">
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
                <div className={`absolute top-6 right-4 px-3 py-1.5 bg-gradient-to-r ${getStatusColor(job.status)} text-white text-xs font-bold rounded-full shadow-md z-10 flex items-center gap-1.5`}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    {getStatusLabel(job.status)}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    {/* Header with Logo and Title */}
                    <div className="flex items-start gap-4 mb-5">
                        {showCompany && job.company_name && (
                            <div className="relative flex-shrink-0">
                                <div className="w-16 h-16 rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden bg-white group-hover/card:border-primary-light transition-colors">
                                    <CompanyLogo
                                        avatarUrl={job.avatar_url}
                                        companyName={job.company_name}
                                        size="lg"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 leading-snug group-hover/card:text-primary transition-colors">
                                {job.title}
                            </h3>
                            {showCompany && job.company_name && (
                                <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                                    <Building className="h-3.5 w-3.5 text-gray-400" />
                                    {job.company_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-3 mb-5 flex-1">
                        {job.location && (
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{job.location}</span>
                            </div>
                        )}
                        {job.employment_type && (
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Briefcase className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium capitalize">
                                    {job.employment_type.replace("_", " ")}
                                </span>
                            </div>
                        )}
                        {formatSalary() && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="font-bold text-green-700">{formatSalary()}</span>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {job.required_skills && job.required_skills.length > 0 && (
                        <div className="mb-5 pb-5 border-b border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                {job.required_skills.slice(0, 3).map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-primary rounded-md text-xs font-semibold border border-blue-100"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {job.required_skills.length > 3 && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-semibold border border-gray-200">
                                        +{job.required_skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto">
                        {showStats ? (
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span className="font-medium">{job.views_count || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5" />
                                        <span className="font-medium">{job.applications_count || 0}</span>
                                    </div>
                                </div>
                                {job.created_at && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            job.created_at && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )
                        )}

                        {/* View Button */}
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:bg-primary-hover transition-all group-hover/card:gap-3">
                            <span>View Details</span>
                            <ArrowRight className="h-4 w-4 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

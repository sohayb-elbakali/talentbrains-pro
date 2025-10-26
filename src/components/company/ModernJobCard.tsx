import { motion } from "framer-motion";
import {
    Briefcase,
    Building,
    Calendar,
    DollarSign,
    Eye,
    MapPin,
    Star,
    TrendingUp,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import CompanyLogo from "../CompanyLogo";

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
            active: "from-green-400 to-emerald-500",
            draft: "from-yellow-400 to-orange-400",
            closed: "from-gray-400 to-gray-500",
            archived: "from-red-400 to-pink-400",
        };
        return colors[status] || "from-blue-400 to-cyan-400";
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
        <Link to={`/company/jobs/${job.id}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="group relative bg-gradient-to-br from-white via-white to-purple-50/20 rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-purple-300 transition-all duration-300"
            >
                {/* Decorative background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 bg-gradient-to-r ${getStatusColor(job.status)} text-white text-xs font-bold rounded-full shadow-md z-10`}>
                    {getStatusLabel(job.status)}
                </div>

                <div className="p-6 relative z-10">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                        {showCompany && job.company_name && (
                            <div className="relative flex-shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl blur opacity-30"></div>
                                <div className="relative">
                                    <CompanyLogo
                                        avatarUrl={job.avatar_url}
                                        companyName={job.company_name}
                                        size="md"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-all line-clamp-2 mb-1">
                                {job.title}
                            </h3>
                            {showCompany && job.company_name && (
                                <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                    <Building className="h-3.5 w-3.5" />
                                    {job.company_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {job.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                </div>
                                <span className="font-medium truncate">{job.location}</span>
                            </div>
                        )}
                        {job.employment_type && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                    <Briefcase className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium capitalize">
                                    {job.employment_type.replace("_", " ")}
                                </span>
                            </div>
                        )}
                        {formatSalary() && (
                            <div className="flex items-center gap-2 text-sm">
                                <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="font-bold text-green-700">{formatSalary()}</span>
                            </div>
                        )}
                        {job.created_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                                    <Calendar className="h-4 w-4 text-gray-600" />
                                </div>
                                <span className="text-xs">
                                    {new Date(job.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {job.required_skills && job.required_skills.length > 0 && (
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {job.required_skills.slice(0, 3).map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-lg text-xs font-semibold"
                                    >
                                        <Star className="h-3 w-3" />
                                        {skill}
                                    </span>
                                ))}
                                {job.required_skills.length > 3 && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                                        +{job.required_skills.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    {showStats && (
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-1.5 text-sm">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span className="font-semibold text-gray-700">
                                    {job.views_count || 0}
                                </span>
                                <span className="text-gray-500 text-xs">views</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <Users className="h-3.5 w-3.5 text-green-600" />
                                </div>
                                <span className="font-semibold text-gray-700">
                                    {job.applications_count || 0}
                                </span>
                                <span className="text-gray-500 text-xs">applicants</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm ml-auto">
                                <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-xs font-semibold text-purple-600">
                                    {job.match_rate || 0}% match
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Hover Action */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
            </motion.div>
        </Link>
    );
}

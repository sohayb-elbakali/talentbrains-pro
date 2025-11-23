import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  Calendar,
  DollarSign,
  Globe,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ModernTalentCardProps {
  talent: any;
  showActions?: boolean;
}

export default function ModernTalentCard({
  talent,
  showActions = false,
}: ModernTalentCardProps) {
  const getExperienceLabel = (level: string) => {
    const labels: any = {
      entry: "Entry Level",
      mid: "Mid Level",
      senior: "Senior",
      lead: "Lead/Principal",
    };
    return labels[level] || level;
  };

  const getAvailabilityColor = (status: string) => {
    const colors: any = {
      available: "from-green-400 to-emerald-500",
      open_to_offers: "from-blue-400 to-cyan-400",
      not_looking: "from-gray-400 to-gray-500",
    };
    return colors[status] || "from-gray-400 to-gray-500";
  };

  const getAvailabilityLabel = (status: string) => {
    const labels: any = {
      available: "Available",
      open_to_offers: "Open to Offers",
      not_looking: "Not Looking",
    };
    return labels[status] || status;
  };

  return (
    <Link to={`/talents/${talent.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="group relative bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-primary-light transition-all duration-300"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Availability Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 bg-gradient-to-r ${getAvailabilityColor(talent.availability_status)} text-white text-xs font-bold rounded-full shadow-md z-10`}>
          {getAvailabilityLabel(talent.availability_status)}
        </div>

        <div className="p-6 relative z-10">
          {/* Header with Avatar */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
              <img
                src={
                  talent.profile?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.profile?.full_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`
                }
                alt={talent.profile?.full_name}
                className="relative w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    talent.profile?.full_name || "User"
                  )}&background=3B82F6&color=fff&size=128&bold=true`;
                }}
              />
              {talent.profile?.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <Award className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-all line-clamp-1 mb-1">
                {talent.profile?.full_name || "Anonymous"}
              </h3>
              <p className="text-sm font-semibold text-primary mb-1">
                {talent.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Briefcase className="h-3 w-3" />
                <span>{getExperienceLabel(talent.experience_level)}</span>
                <span className="text-gray-400">•</span>
                <span>{talent.years_of_experience}y exp</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {talent.location && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium truncate">{talent.location}</span>
              </div>
            )}
            {talent.remote_preference !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Globe className="h-4 w-4 text-secondary" />
                </div>
                <span className="font-medium">
                  {talent.remote_preference ? "Remote OK" : "On-site"}
                </span>
              </div>
            )}
            {(talent.salary_expectation_min || talent.salary_expectation_max) && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-bold text-green-700">
                  ${talent.salary_expectation_min?.toLocaleString()} - $
                  {talent.salary_expectation_max?.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Skills */}
          {talent.skills && talent.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {talent.skills.slice(0, 4).map((skill: any, index: number) => {
                  const skillName = typeof skill === "string" ? skill : skill.name || skill.skill_name;
                  const isPrimary = typeof skill === "object" && skill.is_primary;

                  return (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isPrimary
                          ? "bg-primary text-white"
                          : "bg-blue-50 text-primary"
                        }`}
                    >
                      {isPrimary && <Star className="h-3 w-3" fill="currentColor" />}
                      {skillName}
                    </span>
                  );
                })}
                {talent.skills.length > 4 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                    +{talent.skills.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bio Preview */}
          {talent.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {talent.bio}
            </p>
          )}

          {/* Footer Stats */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5 text-sm">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary">
                {talent.match_score || 0}% match
              </span>
            </div>
            {talent.created_at && (
              <div className="flex items-center gap-1.5 text-sm ml-auto">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Joined {new Date(talent.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Hover Action */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </div>
      </motion.div>
    </Link>
  );
}

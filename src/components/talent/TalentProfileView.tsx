import { Calendar, Clock, DollarSign, MapPin, Star, User } from "lucide-react";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";
import ProfileViewCard, {
  ProfileField,
  ProfileLink,
  ProfileSection,
  ProfileTags,
} from "../profile/ProfileViewCard";
import SkillsDisplay from "../skills/SkillsDisplay";
import { useQuery } from "@tanstack/react-query";

interface TalentProfileViewProps {
  onEdit?: () => void;
  onAvatarEdit?: () => void;
}

export default function TalentProfileView({ onEdit, onAvatarEdit }: TalentProfileViewProps) {
  const { user } = useAuth();
  const { data, isLoading: loading } = useUserData(user?.id);
  const talent = data?.talent;
  const profile = data?.profile;

  // Fetch talent skills using React Query for automatic refresh
  const { data: skills = [], isLoading: loadingSkills } = useQuery({
    queryKey: ['talent-skills', talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data: skillsData } = await db.getTalentSkills(talent.id);
      return skillsData || [];
    },
    enabled: !!talent?.id,
    staleTime: 0, // Always fetch fresh data
  });

  const formatExperienceLevel = (level: string) => {
    const levels = {
      entry: "Entry Level (0-2 years)",
      mid: "Mid Level (3-5 years)",
      senior: "Senior Level (6-10 years)",
      lead: "Lead/Principal (10+ years)",
    };
    return levels[level as keyof typeof levels] || level;
  };

  const formatAvailabilityStatus = (status: string) => {
    const statuses = {
      available: "Available",
      open_to_offers: "Open to offers",
      not_looking: "Not looking",
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!talent) {
    return (
      <ProfileViewCard title="Talent Profile">
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Talent Profile
          </h3>
          <p className="text-gray-500 mb-4">
            Complete your talent profile to get started.
          </p>
          {onEdit && (
            <button
              onClick={onEdit}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Complete Profile
            </button>
          )}
        </div>
      </ProfileViewCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar */}
      <ProfileViewCard title="Profile">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
              alt={profile?.full_name}
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=8B5CF6&color=fff&size=256&bold=true`;
              }}
            />
            {onAvatarEdit && (
              <button
                onClick={onAvatarEdit}
                className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-110"
                title="Change Avatar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile?.full_name}</h2>
            <p className="text-lg text-purple-600 font-semibold mb-2">{talent.title}</p>
            <p className="text-gray-600">{profile?.email}</p>
          </div>
        </div>
      </ProfileViewCard>

      {/* Basic Information */}
      <ProfileViewCard title="Professional Information">
        <div className="flex justify-between items-start mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ProfileField label="Job Title" value={talent.title} />
              <ProfileField
                label="Experience Level"
                value={formatExperienceLevel(talent.experience_level)}
              />
              <ProfileField
                label="Years of Experience"
                value={talent.years_of_experience}
              />
            </div>
            <div>
              <ProfileField label="Location">
                <div className="flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {talent.location || "Not specified"}
                </div>
              </ProfileField>
              <ProfileField
                label="Remote Work"
                value={talent.remote_preference}
              />
              <ProfileField label="Availability Status">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${talent.availability_status === "available"
                    ? "bg-green-100 text-green-800"
                    : talent.availability_status === "open_to_offers"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {formatAvailabilityStatus(talent.availability_status)}
                </span>
              </ProfileField>
            </div>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors ml-4"
            >
              Update Profile
            </button>
          )}
        </div>
        <div className="mt-6">
          <ProfileField label="Professional Bio" value={talent.bio} />
        </div>
      </ProfileViewCard>

      {/* Skills & Expertise */}
      <ProfileViewCard title="Skills & Expertise">
        {loadingSkills ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-500 mt-3 text-sm">Loading skills...</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
              <Star className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skills Added Yet</h3>
            <p className="text-gray-500 mb-4">
              Showcase your expertise by adding your skills
            </p>
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                Add Skills
              </button>
            )}
          </div>
        ) : (
          <SkillsDisplay
            skills={skills}
            variant="card"
            showProficiency={true}
          />
        )}
      </ProfileViewCard>

      {/* Compensation */}
      <ProfileViewCard title="Compensation Expectations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ProfileField label="Hourly Rate Range">
              <div className="flex items-center text-sm text-gray-900">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                {talent.hourly_rate_min && talent.hourly_rate_max
                  ? `$${talent.hourly_rate_min} - $${talent.hourly_rate_max}/hour`
                  : talent.hourly_rate_min
                    ? `From $${talent.hourly_rate_min}/hour`
                    : talent.hourly_rate_max
                      ? `Up to $${talent.hourly_rate_max}/hour`
                      : "Not specified"}
              </div>
            </ProfileField>
          </div>
          <div>
            <ProfileField label="Annual Salary Expectation">
              <div className="flex items-center text-sm text-gray-900">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                {talent.salary_expectation_min && talent.salary_expectation_max
                  ? `$${talent.salary_expectation_min.toLocaleString()} - $${talent.salary_expectation_max.toLocaleString()}/year`
                  : talent.salary_expectation_min
                    ? `From $${talent.salary_expectation_min.toLocaleString()}/year`
                    : talent.salary_expectation_max
                      ? `Up to $${talent.salary_expectation_max.toLocaleString()}/year`
                      : "Not specified"}
              </div>
            </ProfileField>
          </div>
        </div>
      </ProfileViewCard>

      {/* Professional Links */}
      <ProfileViewCard title="Professional Links">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ProfileLink label="Portfolio" url={talent.portfolio_url} />
            <ProfileLink label="Resume" url={talent.resume_url} />
          </div>
          <div>
            <ProfileLink label="GitHub" url={talent.github_url} />
            <ProfileLink label="LinkedIn" url={talent.linkedin_url} />
          </div>
        </div>
      </ProfileViewCard>

      {/* Additional Information */}
      <ProfileViewCard title="Additional Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ProfileTags label="Languages" tags={talent.languages || []} />
            <ProfileField label="Timezone">
              <div className="flex items-center text-sm text-gray-900">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {talent.timezone || "Not specified"}
              </div>
            </ProfileField>
          </div>
          <div>
            <ProfileField
              label="Work Authorization"
              value={talent.work_authorization}
            />
            <ProfileField label="Member Since">
              <div className="flex items-center text-sm text-gray-900">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {new Date(talent.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </ProfileField>
          </div>
        </div>
      </ProfileViewCard>

      {/* Education & Certifications */}
      <ProfileViewCard title="Education & Certifications">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileSection
            title="Education"
            items={
              talent.education?.map((edu: any) => ({
                title: edu.degree,
                subtitle: edu.institution,
                description: edu.description,
                year: edu.year,
              })) || []
            }
          />
          <ProfileSection
            title="Certifications"
            items={
              talent.certifications?.map((cert: any) => ({
                title: cert.name,
                subtitle: cert.issuer,
                description: cert.description,
                year: cert.year,
                url: cert.url,
              })) || []
            }
          />
        </div>
      </ProfileViewCard>
    </div>
  );
}

import { Building, Calendar, Globe, MapPin, Camera } from "lucide-react";
import { useAuth, useUserData } from "../../hooks/useAuth";
import ProfileViewCard, {
  ProfileField,
  ProfileLink,
  ProfileTags,
} from "../profile/ProfileViewCard";
import CompanyLogo from "../profile/CompanyLogo";

interface CompanyProfileViewProps {
  onEdit?: () => void;
  onAvatarEdit?: () => void;
}

export default function CompanyProfileView({
  onEdit,
  onAvatarEdit,
}: CompanyProfileViewProps) {
  const { user } = useAuth();
  const { data, isLoading, error } = useUserData(user?.id);
  const company = data?.company;
  const profile = data?.profile;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
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

  if (error) {
    return <div>Error loading profile: {error.message}</div>;
  }

  if (!company) {
    return (
      <ProfileViewCard title="Company Profile">
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Company Profile
          </h3>
          <p className="text-gray-500 mb-4">
            Complete your company profile to get started.
          </p>
          {onEdit && (
            <button
              onClick={onEdit}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      {/* Company Logo Section */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Logo Display */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-white">
                <CompanyLogo
                  avatarUrl={profile?.avatar_url}
                  companyName={company.name}
                  size="xl"
                  className="w-full h-full"
                />
              </div>
              {onAvatarEdit && (
                <button
                  onClick={onAvatarEdit}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-110 border-4 border-white"
                  title="Upload Company Logo"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h2>
            {company.tagline && (
              <p className="text-lg text-gray-600 mb-4">{company.tagline}</p>
            )}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {company.industry && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-primary rounded-lg text-sm font-semibold border border-blue-100">
                  <Building className="h-4 w-4" />
                  {company.industry}
                </span>
              )}
              {company.company_size && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                  {company.company_size}
                </span>
              )}
            </div>
            {!profile?.avatar_url && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>Upload your company logo to make your job postings stand out!</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Information */}
      <ProfileViewCard title="Company Details">
        <div className="flex justify-between items-start mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ProfileField label="Company Name" value={company.name} />
              <ProfileField label="Industry" value={company.industry} />
              <ProfileField
                label="Company Size"
                value={
                  company.company_size
                    ? `${company.company_size} employees`
                    : undefined
                }
              />
            </div>
            <div>
              <ProfileField label="Location">
                <div className="flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {company.location || "Not specified"}
                </div>
              </ProfileField>
              <ProfileField label="Founded Year">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {company.founded_year || "Not specified"}
                </div>
              </ProfileField>
              <ProfileField label="Website">
                <div className="flex items-center text-sm">
                  <Globe className="h-4 w-4 mr-2 text-gray-400" />
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 underline"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not provided</span>
                  )}
                </div>
              </ProfileField>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <ProfileField label="Description" value={company.description} />
        </div>
      </ProfileViewCard>

      {/* Culture & Benefits */}
      <ProfileViewCard title="Culture & Benefits">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileTags
            label="Culture Values"
            tags={company.culture_values || []}
          />
          <ProfileTags label="Benefits Offered" tags={company.benefits || []} />
        </div>
      </ProfileViewCard>

      {/* Social Media */}
      <ProfileViewCard title="Social Media & Links">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ProfileLink
              label="LinkedIn"
              url={company.social_links?.linkedin}
            />
            <ProfileLink label="Twitter" url={company.social_links?.twitter} />
          </div>
          <div>
            <ProfileLink
              label="Facebook"
              url={company.social_links?.facebook}
            />
            <ProfileLink
              label="Additional Website"
              url={company.social_links?.website}
            />
          </div>
        </div>
      </ProfileViewCard>

      {/* Verification Status */}
      <ProfileViewCard title="Account Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Verification Status">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.is_verified
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {company.is_verified ? "Verified" : "Pending Verification"}
            </span>
          </ProfileField>
          <ProfileField label="Member Since">
            {new Date(company.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </ProfileField>
        </div>
      </ProfileViewCard>
    </div>
  );
}

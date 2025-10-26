import { Building, Camera, Edit } from "lucide-react";
import { useState } from "react";
import { notificationManager } from "../utils/notificationManager";
import AvatarSelector from "../components/AvatarSelector";
import CompanyProfileUpdateModal from "../components/company/CompanyProfileUpdateModal";
import CompanyProfileView from "../components/company/CompanyProfileView";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth, useUserData } from "../hooks/useAuth";
import { db } from "../lib/supabase";

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useUserData(user?.id);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);

  const handleUpdateComplete = async () => {
    setIsUpdateModalOpen(false);
    notificationManager.showSuccess("Company profile updated successfully!");
    // Force page reload to refresh data
    window.location.reload();
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    if (!user?.id) return;

    try {
      // Update profile avatar_url in the profiles table
      const { error } = await db.updateProfile(user.id, {
        avatar_url: avatarUrl,
      });

      if (error) {
        notificationManager.showError("Failed to update avatar");
        return;
      }

      // Refetch user data
      await refetch();
      notificationManager.showSuccess("Avatar updated successfully!");
    } catch (error) {
      console.error("Avatar update error:", error);
      notificationManager.showError("Failed to update avatar");
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading company profile..." />;
  }

  if (error) {
    return <div>Error loading profile: {error.message}</div>;
  }

  const companyData = data?.company;
  const profile = data?.profile;

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="h-8 w-8 text-purple-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Company Profile
                    </h1>
                    <p className="text-gray-600">
                      Manage your company information
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Complete Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-12 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Company Profile Found
              </h3>
              <p className="text-gray-500 mb-6">
                Complete your company profile to get started with TalentBrains.
              </p>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                Complete Profile
              </button>
            </div>
          </div>
        </div>

        {/* Update Modal */}
        <CompanyProfileUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={handleUpdateComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {companyData.name}
                  </h1>
                  <p className="text-gray-600">{companyData.industry}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <CompanyProfileView 
          onEdit={() => setIsUpdateModalOpen(true)}
          onAvatarEdit={() => setIsAvatarSelectorOpen(true)}
        />

        {/* Update Modal */}
        <CompanyProfileUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={handleUpdateComplete}
        />

        {/* Avatar Selector Modal */}
        {isAvatarSelectorOpen && (
          <AvatarSelector
            currentAvatar={profile?.avatar_url || undefined}
            userName={companyData?.company_name || profile?.full_name || "Company"}
            onAvatarSelect={handleAvatarUpdate}
            onClose={() => setIsAvatarSelectorOpen(false)}
            isCompany={true}
          />
        )}
      </div>
    </div>
  );
}

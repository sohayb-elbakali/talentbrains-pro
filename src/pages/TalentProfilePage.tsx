import { Edit, User } from "lucide-react";
import { useState } from "react";
import { notificationManager } from "../utils/notificationManager";
import AvatarSelector from "../components/AvatarSelector";
import TalentProfileUpdateModal from "../components/talent/TalentProfileUpdateModal";
import TalentProfileView from "../components/talent/TalentProfileView";
import { useAuth, useUserData } from "../hooks/useAuth";
import { db } from "../lib/supabase";

export default function TalentProfilePage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useUserData(user?.id);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);



  const handleUpdateComplete = async () => {
    setIsUpdateModalOpen(false);
    // Refetch will happen automatically via React Query
    await refetch();
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
      notificationManager.showError("Failed to update avatar");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const talentData = data?.talent;
  const profile = data?.profile;
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Profile Data...</h2>
          <p className="text-gray-600 mb-6">
            User ID: {user?.id || "Not found"}
          </p>
          <p className="text-sm text-gray-500">
            If this persists, try signing out and back in.
          </p>
        </div>
      </div>
    );
  }

  if (!talentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Talent Profile
                  </h1>
                  <p className="text-gray-600">
                    Manage your professional information
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <Edit className="inline h-5 w-5 mr-2" />
                Complete Profile
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Welcome to TalentBrains! 👋
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Let's set up your talent profile to start connecting with amazing opportunities.
            </p>
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Get Started - Complete Your Profile
            </button>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Profile data: {JSON.stringify({ hasProfile: !!profile, hasUser: !!user })}
              </p>
            </div>
          </div>
        </div>

        {/* Update Modal */}
        <TalentProfileUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={handleUpdateComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {talentData.title || "Talent Profile"}
                </h1>
                <p className="text-gray-600">{profile?.full_name || profile?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              <Edit className="inline h-5 w-5 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <TalentProfileView 
          onEdit={() => setIsUpdateModalOpen(true)}
          onAvatarEdit={() => setIsAvatarSelectorOpen(true)}
        />

        {/* Update Modal */}
        <TalentProfileUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdate={handleUpdateComplete}
        />

        {/* Avatar Selector Modal */}
        {isAvatarSelectorOpen && (
          <AvatarSelector
            currentAvatar={profile?.avatar_url || undefined}
            userName={profile?.full_name || "User"}
            onAvatarSelect={handleAvatarUpdate}
            onClose={() => setIsAvatarSelectorOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

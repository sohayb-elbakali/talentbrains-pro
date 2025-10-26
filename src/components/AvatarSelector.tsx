import { useState } from "react";
import { X } from "lucide-react";

interface AvatarSelectorProps {
  currentAvatar?: string;
  userName?: string;
  onAvatarSelect: (avatarUrl: string) => void;
  onClose: () => void;
  isCompany?: boolean;
}

const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
];

export default function AvatarSelector({
  currentAvatar,
  userName,
  onAvatarSelect,
  onClose,
  isCompany = false,
}: AvatarSelectorProps) {
  const [customUrl, setCustomUrl] = useState("");

  const handleSelect = (avatarUrl: string) => {
    onAvatarSelect(avatarUrl);
    onClose();
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      handleSelect(customUrl.trim());
      setCustomUrl("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {isCompany ? "Upload Company Logo" : "Choose Your Avatar"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Only show preset avatars for non-company users */}
          {!isCompany && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Choose from Presets
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {DEFAULT_AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(avatar)}
                    className={`relative rounded-full overflow-hidden border-4 transition-all transform hover:scale-110 ${currentAvatar === avatar
                        ? "border-purple-600 ring-4 ring-purple-200 shadow-lg"
                        : "border-gray-200 hover:border-purple-400 hover:shadow-md"
                      }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {isCompany ? "Enter Logo URL" : "Or Use Custom URL"}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleCustomUrl}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Use
              </button>
            </div>
          </div>

          {currentAvatar && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
              <img
                src={currentAvatar}
                alt="Current avatar"
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Current Avatar</p>
                <p className="text-xs text-gray-500 truncate mt-1">{currentAvatar}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

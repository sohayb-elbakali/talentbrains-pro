import { X } from 'lucide-react';
import { Profile } from '../types/profile';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export default function ProfileModal({ isOpen, onClose, profile }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full p-2 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Profile Header with Avatar */}
        <div className="flex items-start space-x-6 mb-6">
          <div className="relative flex-shrink-0">
            <img
              src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=8B5CF6&color=fff&size=256&bold=true`;
              }}
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h2>
            <p className="text-lg text-purple-600 font-semibold mb-2">{profile.tagline}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </span>
              <span className="flex items-center font-semibold text-green-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {profile.rate}
              </span>
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.skills.map((skill: string) => (
            <span key={skill} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
        <h3 className="font-semibold text-lg mb-2">About</h3>
        <p className="text-gray-700">{profile.about}</p>
      </div>
    </div>
  );
}

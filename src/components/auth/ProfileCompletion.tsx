import { motion } from 'framer-motion';
import { useState } from 'react';
import { Brain, User, Briefcase, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notify } from '../../utils/notify';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

// Required field label component
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span>{children} <span className="text-red-500">*</span></span>
);

export default function ProfileCompletion() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    title: '',
    location: '',
    bio: ''
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2 text-slate-900">User not found</h2>
          <p className="text-slate-500 mb-4">You must be logged in to complete your profile.</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      notify.showError('Full name is required');
      return;
    }

    setLoading(true);

    try {
      const result = await updateProfile({
        full_name: formData.full_name.trim(),
        preferences: {
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          title: formData.title.trim()
        }
      });

      if (result?.success) {
        notify.showSuccess('Profile completed successfully!');
        navigate('/dashboard');
      } else {
        notify.showError(result?.error?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      notify.showError(error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header with TalentBrains Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [1, 0.9, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain size={32} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="text-slate-500 mt-1">Get started in just a minute</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Input
              label={<RequiredLabel>Full Name</RequiredLabel>}
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              leftIcon={<User size={18} className="text-slate-400" />}
            />

            <Input
              label="Professional Title"
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Software Engineer"
              leftIcon={<Briefcase size={18} className="text-slate-400" />}
            />

            <Input
              label="Location"
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
              leftIcon={<MapPin size={18} className="text-slate-400" />}
            />

            <Textarea
              label="Bio"
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              placeholder="Tell us about yourself..."
            />

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                disabled={!formData.full_name.trim()}
                fullWidth
                size="lg"
              >
                Complete Profile <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-center text-xs text-slate-400">
              You can update these details later in your profile settings
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

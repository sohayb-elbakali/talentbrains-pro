import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Brain, User, Briefcase, MapPin, Globe, Calendar, DollarSign, Linkedin, Github, Link2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase/index';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Select from '../ui/Select';
import SkillsSelector from '../skills/SkillsSelector';

interface FormData {
  full_name: string;
  title: string;
  bio: string;
  location: string;
  experience_level: string;
  years_of_experience: number;
  availability_status: string;
  remote_preference: boolean;
  timezone: string;
  languages: string;
  hourly_rate_min: number | undefined;
  hourly_rate_max: number | undefined;
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
}

const STEPS = [
  { id: 1, title: 'Identity', icon: User },
  { id: 2, title: 'Experience', icon: Briefcase },
  { id: 3, title: 'Links', icon: Link2 },
];

const experienceLevelOptions = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior (5-10 years)' },
  { value: 'lead', label: 'Expert / Lead (10+ years)' },
];

const availabilityOptions = [
  { value: 'available', label: 'Available for work' },
  { value: 'open_to_offers', label: 'Open to offers' },
  { value: 'not_looking', label: 'Not looking' },
];

const timezoneOptions = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
  'Europe/Paris', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney'
].map(tz => ({ value: tz, label: tz.replace('_', ' ') }));

// Required field label component
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span>{children} <span className="text-red-500">*</span></span>
);

export default function TalentProfileCompletion() {
  const { user, profile, loadUserProfile, setProfileCompletionStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [skills, setSkills] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    title: '',
    bio: '',
    location: '',
    experience_level: 'mid',
    years_of_experience: 0,
    availability_status: 'available',
    remote_preference: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    languages: 'English',
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
  });

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: talentData } = await db.getTalent(user.id);

        if (talentData) {
          setFormData({
            full_name: profile?.full_name || '',
            title: talentData.title || '',
            bio: talentData.bio || '',
            location: talentData.location || '',
            experience_level: talentData.experience_level || 'mid',
            years_of_experience: talentData.years_of_experience || 0,
            availability_status: talentData.availability_status || 'available',
            remote_preference: talentData.remote_preference ?? true,
            timezone: talentData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            languages: (talentData.languages || ['English']).join(', '),
            hourly_rate_min: talentData.hourly_rate_min || undefined,
            hourly_rate_max: talentData.hourly_rate_max || undefined,
            portfolio_url: talentData.portfolio_url || '',
            linkedin_url: talentData.linkedin_url || '',
            github_url: talentData.github_url || '',
          });

          const { data: talentSkills } = await db.getTalentSkills(talentData.id);
          if (talentSkills) setSkills(talentSkills);
        } else {
          setFormData(prev => ({ ...prev, full_name: profile?.full_name || '' }));
        }
      } catch (err) {
        console.error("Error fetching talent data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, [user, profile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checkbox = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checkbox
        : (name.includes('rate') || name.includes('years_of_experience'))
          ? (value === '' ? undefined : Number(value))
          : value
    }));
    setHasUnsavedChanges(true);
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name.trim()) { notify.showError('Full name is required'); return false; }
        if (!formData.title.trim()) { notify.showError('Professional title is required'); return false; }
        if (!formData.location.trim()) { notify.showError('Location is required'); return false; }
        return true;
      case 2:
        if (skills.length === 0) { notify.showError('Please add at least one skill'); return false; }
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      notify.showError('User not found. Please log in again.');
      return;
    }

    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    try {
      // 1. Update profile full_name
      const profileResult = await db.updateProfile(user.id, { full_name: formData.full_name.trim() });
      if (profileResult.error) {
        throw new Error(profileResult.error.message || 'Failed to update profile name');
      }

      const { data: existingTalent } = await db.getTalent(user.id);

      const talentData = {
        title: formData.title.trim(),
        bio: formData.bio.trim() || null,
        location: formData.location.trim(),
        experience_level: formData.experience_level,
        years_of_experience: formData.years_of_experience,
        availability_status: formData.availability_status,
        remote_preference: formData.remote_preference,
        timezone: formData.timezone,
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        hourly_rate_min: formData.hourly_rate_min || null,
        hourly_rate_max: formData.hourly_rate_max || null,
        portfolio_url: formData.portfolio_url.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        github_url: formData.github_url.trim() || null,
        education: [],
        certifications: [],
      };

      let result;
      if (existingTalent) {
        result = await db.updateTalent(existingTalent.id, talentData);
      } else {
        result = await db.createTalent({ profile_id: user.id, ...talentData });
      }

      if (result.error) throw new Error(result.error.message || 'Failed to save profile');

      // Save skills
      if (result.data && skills.length > 0) {
        await db.removeTalentSkills(result.data.id);
        for (const skill of skills) {
          await db.addTalentSkill(
            result.data.id,
            skill.skill_id,
            skill.proficiency_level,
            skill.years_of_experience || 0,
            skill.is_primary || false
          );
        }
      }

      setHasUnsavedChanges(false);
      await loadUserProfile(user.id);
      notify.showSuccess('Profile completed successfully!');
      setProfileCompletionStatus({ needsCompletion: false, type: 'talent' });

      setTimeout(() => navigate('/talent', { replace: true }), 300);
    } catch (error: any) {
      console.error('Profile completion error:', error);
      notify.showError(error?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

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

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-xl border border-slate-100 animate-pulse">
          <div className="h-8 bg-blue-100 rounded-lg w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-100 rounded w-32 mx-auto mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-slate-50 rounded-xl"></div>
            <div className="h-12 bg-slate-50 rounded-xl"></div>
            <div className="h-24 bg-slate-50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl mx-auto"
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
          <p className="text-slate-500 mt-1">Stand out to top companies</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                animate={{
                  backgroundColor: currentStep >= step.id ? '#2563eb' : '#fff',
                  color: currentStep >= step.id ? '#fff' : '#94a3b8',
                  scale: currentStep === step.id ? 1.1 : 1,
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer ${currentStep >= step.id ? 'border-blue-600 shadow-lg shadow-blue-200' : 'border-slate-200'
                  }`}
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              >
                {currentStep > step.id ? <Check size={18} /> : <step.icon size={18} />}
              </motion.div>
              {idx < STEPS.length - 1 && (
                <div className="w-12 h-1 mx-2 rounded bg-slate-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: '0%' }}
                    animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Identity */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                </div>

                <Input
                  label={<RequiredLabel>Full Name</RequiredLabel>}
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  leftIcon={<User size={18} className="text-slate-400" />}
                />

                <Input
                  label={<RequiredLabel>Professional Title</RequiredLabel>}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Full Stack Developer"
                  leftIcon={<Briefcase size={18} className="text-slate-400" />}
                />

                <Input
                  label={<RequiredLabel>Location</RequiredLabel>}
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  leftIcon={<MapPin size={18} className="text-slate-400" />}
                />

                <Select
                  label="Timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  options={timezoneOptions}
                />

                <Textarea
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell companies about yourself..."
                  rows={3}
                />

                {/* Remote Toggle */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Open to Remote Work</p>
                    <p className="text-sm text-slate-500">Available for remote positions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="remote_preference"
                      checked={formData.remote_preference}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 2: Experience & Skills */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Briefcase size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Experience & Skills</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Experience Level"
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    options={experienceLevelOptions}
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    min={0}
                    max={50}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Availability"
                    name="availability_status"
                    value={formData.availability_status}
                    onChange={handleChange}
                    options={availabilityOptions}
                  />
                  <Input
                    label="Languages"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder="e.g. English, French"
                    helperText="Comma separated"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <SkillsSelector selectedSkills={skills} onChange={(newSkills) => {
                      setSkills(newSkills);
                      setHasUnsavedChanges(true);
                    }} />
                  </div>
                </div>

                {/* Compensation */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-blue-600" />
                    Compensation (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min Hourly Rate ($)"
                      type="number"
                      name="hourly_rate_min"
                      value={formData.hourly_rate_min || ''}
                      onChange={handleChange}
                      placeholder="50"
                      min={0}
                    />
                    <Input
                      label="Max Hourly Rate ($)"
                      type="number"
                      name="hourly_rate_max"
                      value={formData.hourly_rate_max || ''}
                      onChange={handleChange}
                      placeholder="150"
                      min={0}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Links */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Link2 size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Online Presence (Optional)</h2>
                </div>

                <Input
                  label="Portfolio URL"
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  leftIcon={<Globe size={18} className="text-slate-400" />}
                />

                <Input
                  label="LinkedIn"
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  leftIcon={<Linkedin size={18} className="text-blue-600" />}
                />

                <Input
                  label="GitHub"
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/..."
                  leftIcon={<Github size={18} className="text-slate-700" />}
                />

                {/* Ready Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900">You're all set!</h3>
                  <p className="text-sm text-slate-600 mt-1">Your profile is ready to shine.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft size={18} className="mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                Next <ChevronRight size={18} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={!formData.full_name || !formData.title || !formData.location || skills.length === 0}
              >
                Complete Profile <Check size={18} className="ml-1" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          You can update your profile anytime from settings
        </p>
      </motion.div>
    </div>
  );
}

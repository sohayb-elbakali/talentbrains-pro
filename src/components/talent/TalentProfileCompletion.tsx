import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, DollarSign, MapPin, User, FileText, Award, Link2, Linkedin, Github, Globe, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase/index';
import SkillsSelector from '../skills/SkillsSelector';
import { Notyf } from 'notyf';

const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

interface FormData {
  title: string;
  bio: string;
  location: string;
  experience_level: string;
  years_of_experience: number;
  availability_status: string;
  remote_preference: boolean;
  timezone: string;
  languages: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User, description: 'Tell us about yourself' },
  { id: 2, title: 'Experience', icon: Award, description: 'Your professional background' },
  { id: 3, title: 'Skills', icon: Briefcase, description: 'What you excel at' },
  { id: 4, title: 'Compensation', icon: DollarSign, description: 'Your rate expectations' },
  { id: 5, title: 'Links', icon: Link2, description: 'Portfolio & social profiles' },
];

export default function TalentProfileCompletion() {
  const { user, checkProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skills, setSkills] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    bio: '',
    location: '',
    experience_level: 'intermediate',
    years_of_experience: 0,
    availability_status: 'available',
    remote_preference: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    languages: 'English',
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    salary_expectation_min: undefined,
    salary_expectation_max: undefined,
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('rate') || name.includes('salary') || name === 'years_of_experience'
        ? value === '' ? undefined : Number(value)
        : value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.bio && formData.location && formData.timezone && formData.languages);
      case 2:
        return !!(formData.experience_level && formData.years_of_experience >= 0);
      case 3:
        return skills.length > 0;
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      notyf.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      notyf.error('User not found. Please log in again.');
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      notyf.error('Please complete all required steps');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting profile submission...', { userId: user.id, formData, skills });

      const { data: existingTalent } = await db.getTalent(user.id);
      console.log('Existing talent:', existingTalent);

      const talentData = {
        ...formData,
        hourly_rate_min: formData.hourly_rate_min || null,
        hourly_rate_max: formData.hourly_rate_max || null,
        salary_expectation_min: formData.salary_expectation_min || null,
        salary_expectation_max: formData.salary_expectation_max || null,
        portfolio_url: formData.portfolio_url || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        // Convert languages string to array
        languages: formData.languages.split(',').map(lang => lang.trim()).filter(Boolean),
        // Required fields with empty defaults
        education: [],
        certifications: [],
      };

      let result;
      if (existingTalent) {
        console.log('Updating existing talent...');
        result = await db.updateTalent(existingTalent.id, talentData);
      } else {
        console.log('Creating new talent...');
        result = await db.createTalent({
          profile_id: user.id,
          ...talentData,
        });
      }

      console.log('Talent save result:', result);

      if (result.error) {
        console.error('Talent save error:', result.error);
        throw new Error(result.error.message || 'Failed to save talent profile');
      }

      if (skills.length > 0 && result.data) {
        console.log('Saving skills...');
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
        console.log('Skills saved successfully');
      }

      await checkProfileCompletion(true);
      notify.showProfileCompletionSuccess();
      navigate('/talent');
    } catch (error: any) {
      console.error('Profile completion error:', error);
      const errorMessage = error?.message || 'Failed to save profile. Please try again.';
      notyf.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level', subtitle: '0-2 years' },
    { value: 'intermediate', label: 'Intermediate', subtitle: '2-5 years' },
    { value: 'senior', label: 'Senior', subtitle: '5-10 years' },
    { value: 'expert', label: 'Expert', subtitle: '10+ years' },
  ];

  const availabilityStatuses = [
    { value: 'available', label: 'Available Now', color: 'green' },
    { value: 'open_to_offers', label: 'Open to Opportunities', color: 'blue' },
    { value: 'not_looking', label: 'Not Looking', color: 'gray' },
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'UTC',
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Professional Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                Bio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <textarea
                  id="bio"
                  name="bio"
                  required
                  value={formData.bio}
                  onChange={handleChange}
                  rows={5}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 resize-none"
                  placeholder="Tell us about your experience, skills, and what you're looking for..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Share your story and what makes you unique</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Timezone <span className="text-red-500">*</span>
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  required
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 bg-white"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="availability_status" className="block text-sm font-semibold text-gray-700 mb-2">
                  Availability <span className="text-red-500">*</span>
                </label>
                <select
                  id="availability_status"
                  name="availability_status"
                  required
                  value={formData.availability_status}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 bg-white"
                >
                  {availabilityStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="languages" className="block text-sm font-semibold text-gray-700 mb-2">
                  Languages <span className="text-red-500">*</span>
                </label>
                <input
                  id="languages"
                  name="languages"
                  type="text"
                  required
                  value={formData.languages}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                  placeholder="e.g., English, Spanish, French"
                />
                <p className="mt-1 text-xs text-gray-500">Separate multiple languages with commas</p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="remote_preference"
                  checked={formData.remote_preference}
                  onChange={(e) => setFormData(prev => ({ ...prev, remote_preference: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Open to remote work opportunities
                </span>
              </label>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experienceLevels.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, experience_level: level.value }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${formData.experience_level === level.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.subtitle}</div>
                      </div>
                      {formData.experience_level === level.value && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="years_of_experience" className="block text-sm font-semibold text-gray-700 mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <input
                id="years_of_experience"
                name="years_of_experience"
                type="number"
                required
                min="0"
                max="50"
                value={formData.years_of_experience}
                onChange={handleChange}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                placeholder="5"
              />
              <p className="mt-2 text-sm text-gray-500">Total years of professional experience</p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Your Skills <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">Add at least one skill to continue</p>
            </div>
            <SkillsSelector
              selectedSkills={skills}
              onChange={setSkills}
            />
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 This information is optional but helps match you with better opportunities
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Hourly Rate Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hourly_rate_min" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum ($/hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      id="hourly_rate_min"
                      name="hourly_rate_min"
                      type="number"
                      min="0"
                      value={formData.hourly_rate_min || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hourly_rate_max" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum ($/hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      id="hourly_rate_max"
                      name="hourly_rate_max"
                      type="number"
                      min="0"
                      value={formData.hourly_rate_max || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Annual Salary Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="salary_expectation_min" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum ($/year)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      id="salary_expectation_min"
                      name="salary_expectation_min"
                      type="number"
                      min="0"
                      value={formData.salary_expectation_min || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                      placeholder="80000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="salary_expectation_max" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum ($/year)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      id="salary_expectation_max"
                      name="salary_expectation_max"
                      type="number"
                      min="0"
                      value={formData.salary_expectation_max || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                      placeholder="120000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-800">
                🔗 Add your online presence to showcase your work and connect with employers
              </p>
            </div>

            <div>
              <label htmlFor="portfolio_url" className="block text-sm font-semibold text-gray-700 mb-2">
                Portfolio Website
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="portfolio_url"
                  name="portfolio_url"
                  type="url"
                  value={formData.portfolio_url || ''}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-semibold text-gray-700 mb-2">
                LinkedIn Profile
              </label>
              <div className="relative">
                <Linkedin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url || ''}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div>
              <label htmlFor="github_url" className="block text-sm font-semibold text-gray-700 mb-2">
                GitHub Profile
              </label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="github_url"
                  name="github_url"
                  type="url"
                  value={formData.github_url || ''}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                  placeholder="https://github.com/yourusername"
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Let's set up your talent profile to get started
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <step.icon className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                  </motion.div>
                  <span className={`text-xs md:text-sm font-medium mt-2 text-center hidden md:block ${currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Step Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 md:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                {(() => {
                  const StepIcon = STEPS[currentStep - 1].icon;
                  return <StepIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />;
                })()}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {STEPS[currentStep - 1].title}
                </h2>
                <p className="text-sm md:text-base text-blue-100">
                  {STEPS[currentStep - 1].description}
                </p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 md:px-8 py-8">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 md:px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                  }`}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden md:inline">Previous</span>
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-blue-600">{currentStep}</span>
                <span>/</span>
                <span>{STEPS.length}</span>
              </div>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <span>Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-500"
        >
          <p>
            Need help? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact support</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

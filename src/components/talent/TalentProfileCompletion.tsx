import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, MapPin, User, FileText, Award, Link2, Linkedin, Github, Globe, ChevronRight, ChevronLeft, Check, Calendar } from 'lucide-react';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase/index';
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
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
}

const STEPS = [
  { id: 1, title: 'Identity', icon: User, description: 'Define your professional brand' },
  { id: 2, title: 'Expertise', icon: Award, description: 'Your history and skills' },
  { id: 3, title: 'Presence', icon: Link2, description: 'Compensation and links' },
];

export default function TalentProfileCompletion() {
  const { user, profile, setProfile, loadUserProfile, setProfileCompletionStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [skills, setSkills] = useState<any[]>([]);
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
    salary_expectation_min: undefined,
    salary_expectation_max: undefined,
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        console.log('Fetching existing talent data for user:', user.id);
        const { data: talentData } = await db.getTalent(user.id);
        const { data: talentSkills } = await db.getTalentSkills(user.id);

        if (talentData) {
          console.log('Found existing talent data:', talentData);
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
            languages: (talentData.languages || []).join(', '),
            hourly_rate_min: talentData.hourly_rate_min || undefined,
            hourly_rate_max: talentData.hourly_rate_max || undefined,
            salary_expectation_min: talentData.salary_expectation_min || undefined,
            salary_expectation_max: talentData.salary_expectation_max || undefined,
            portfolio_url: talentData.portfolio_url || '',
            linkedin_url: talentData.linkedin_url || '',
            github_url: talentData.github_url || '',
          });

          // Fetch skills using the correct TALENT ID
          const { data: talentSkills } = await db.getTalentSkills(talentData.id);
          if (talentSkills) {
            console.log('Found existing talent skills:', talentSkills);
            setSkills(talentSkills);
          }
        } else {
          setFormData(prev => ({
            ...prev,
            full_name: profile?.full_name || ''
          }));
        }
      } catch (err) {
        console.error("Error fetching talent data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, [user]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name.includes('rate') || name.includes('salary') || name === 'years_of_experience')
        ? value === '' ? undefined : Number(value)
        : value
    }));


  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.full_name && formData.title && formData.bio && formData.location && formData.timezone && formData.languages);
      case 2:
        return !!(formData.experience_level && formData.years_of_experience >= 0 && skills.length > 0);
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

    if (!formData.full_name) { notify.showError('Full name is required'); setCurrentStep(1); return; }
    if (!formData.title) { notify.showError('Professional title is required'); setCurrentStep(1); return; }
    if (!formData.bio) { notify.showError('Professional bio is required'); setCurrentStep(1); return; }
    if (!formData.location) { notify.showError('Location is required'); setCurrentStep(1); return; }
    if (!formData.timezone) { notify.showError('Timezone is required'); setCurrentStep(1); return; }
    if (!formData.languages) { notify.showError('Languages are required'); setCurrentStep(1); return; }

    if (!formData.experience_level) { notify.showError('Experience level is required'); setCurrentStep(2); return; }
    if (formData.years_of_experience === undefined || formData.years_of_experience < 0) { notify.showError('Years of experience is required'); setCurrentStep(2); return; }
    if (skills.length === 0) { notify.showError('Please add at least one skill'); setCurrentStep(2); return; }

    setLoading(true);
    try {
      console.log('Starting profile submission...', { userId: user.id, formData, skills });

      // 1. Update primary profile if name changed
      if (formData.full_name && formData.full_name !== (profile?.full_name || user?.user_metadata?.full_name)) {
        console.log('Updating profile full_name...');
        await db.updateProfile(user.id, { full_name: formData.full_name });
      }

      const { data: existingTalent } = await db.getTalent(user.id);
      console.log('Existing talent:', existingTalent);

      // 2. Prepare talent data (remove non-talent fields)
      const { full_name, ...talentFields } = formData;

      const talentData = {
        ...talentFields,
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

      // Load user profile from scratch to ensure all states are fresh
      await loadUserProfile(user.id);
      notify.showProfileCompletionSuccess();

      // Manually set completion status to false to prevent race conditions with ProtectedRoute
      setProfileCompletionStatus({ needsCompletion: false, type: 'talent' });

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate('/talent', { replace: true });
      }, 300);
    } catch (error: any) {
      console.error('Profile completion error:', error);
      const errorMessage = error?.message || 'Failed to save profile. Please try again.';
      notify.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level', subtitle: '0-2 years', icon: User },
    { value: 'mid', label: 'Mid Level', subtitle: '2-5 years', icon: Briefcase },
    { value: 'senior', label: 'Senior', subtitle: '5-10 years', icon: Award },
    { value: 'lead', label: 'Expert / Lead', subtitle: '10+ years', icon: Check },
  ];



  const timezones = [
    'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
    'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney', 'UTC'
  ];

  const inputStyles = "w-full pl-12 pr-4 py-4 !bg-slate-50/50 focus:!bg-white border-2 border-slate-100/80 focus:border-blue-500 rounded-2xl transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400/70 shadow-sm focus:shadow-blue-100/50";
  const labelStyles = "block text-xs font-black text-slate-500 mb-2 uppercase tracking-[0.15em]";

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Basic Identity</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="full_name" className={labelStyles}>
                  Full Name <span className="text-blue-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                    <User size={20} />
                  </div>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className={inputStyles}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="title" className={labelStyles}>
                  Professional Title <span className="text-blue-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                    <Briefcase size={20} />
                  </div>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className={inputStyles}
                    placeholder="e.g. Senior Full Stack Engineer"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className={labelStyles}>
                  Professional Bio <span className="text-blue-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                    <FileText size={20} />
                  </div>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className={`${inputStyles} py-4 min-h-[140px] resize-none`}
                    placeholder="Tell us about your expertise, achievements, and what drives you..."
                  />
                  <div className="flex justify-end mt-2 px-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${formData.bio.length < 100 ? 'text-amber-500' : 'text-blue-500'}`}>
                      {formData.bio.length} / 100+ chars
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className={labelStyles}>
                    Location <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors z-10">
                      <MapPin size={20} />
                    </div>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className={inputStyles}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="timezone" className={labelStyles}>
                    Timezone <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10">
                      <Globe size={20} />
                    </div>
                    <select
                      id="timezone"
                      name="timezone"
                      required
                      value={formData.timezone}
                      onChange={handleChange}
                      className={`${inputStyles} appearance-none`}
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="languages" className={labelStyles}>
                    Languages <span className="text-blue-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      id="languages"
                      name="languages"
                      type="text"
                      required
                      value={formData.languages}
                      onChange={handleChange}
                      className={`${inputStyles} pl-4`}
                      placeholder="e.g. English, French"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.remote_preference ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Remote</h4>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Open to global</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.remote_preference}
                      onChange={(e) => setFormData(prev => ({ ...prev, remote_preference: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>
              </div>
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
            className="space-y-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Award size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Work Experience & Skills</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experienceLevels.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, experience_level: level.value }))}
                    className={`p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden ${formData.experience_level === level.value
                      ? 'border-blue-600 bg-blue-50/50 shadow-md transform scale-[1.02]'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.experience_level === level.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                        }`}>
                        <level.icon size={26} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-lg text-slate-900">{level.label}</span>
                        </div>
                        <p className={`text-sm font-bold transition-colors ${formData.experience_level === level.value ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                          {level.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="years_of_experience" className={labelStyles}>
                  Total Years of Experience <span className="text-blue-500">*</span>
                </label>
                <div className="relative group max-w-xs">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                    <Calendar size={20} />
                  </div>
                  <input
                    id="years_of_experience"
                    name="years_of_experience"
                    type="number"
                    required
                    min="0"
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    className={`${inputStyles} text-2xl font-black`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black uppercase text-[10px] tracking-widest bg-slate-100 px-2 py-1 rounded-lg">Years</div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              <div className="space-y-4">
                <label className={labelStyles}>Command your Skills <span className="text-blue-500">*</span></label>
                <div className="bg-slate-50/50 border border-slate-100/50 rounded-3xl p-6">
                  <SkillsSelector
                    selectedSkills={skills}
                    onChange={setSkills}
                  />
                </div>
              </div>
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
            className="space-y-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <DollarSign size={20} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Value & Presence</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Hourly Rate ($)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      id="hourly_rate_min"
                      name="hourly_rate_min"
                      type="number"
                      value={formData.hourly_rate_min || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-4 !bg-slate-50/50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl transition-all outline-none text-slate-900 font-bold"
                      placeholder="Min"
                    />
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      id="hourly_rate_max"
                      name="hourly_rate_max"
                      type="number"
                      value={formData.hourly_rate_max || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-4 !bg-slate-50/50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl transition-all outline-none text-slate-900 font-bold"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Digital Footprint</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0A66C2]">
                      <Linkedin size={20} />
                    </div>
                    <input
                      id="linkedin_url"
                      name="linkedin_url"
                      type="url"
                      value={formData.linkedin_url || ''}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 !bg-[#0A66C2]/5 border-2 border-[#0A66C2]/10 focus:border-[#0A66C2] rounded-2xl outline-none text-slate-900"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#181717]">
                      <Github size={20} />
                    </div>
                    <input
                      id="github_url"
                      name="github_url"
                      type="url"
                      value={formData.github_url || ''}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 !bg-[#181717]/5 border-2 border-[#181717]/10 focus:border-[#181717] rounded-2xl outline-none text-slate-900"
                      placeholder="GitHub URL"
                    />
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-[2rem] p-8 flex flex-col items-center text-center gap-4"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <Check size={32} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-emerald-900 text-xl font-bold">Ready to shine?</h4>
                  <p className="text-emerald-700/80 font-medium">Your profile is ready to inspire.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-[120px]" />
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl p-12 w-full max-w-2xl border border-white/50 animate-pulse relative z-10 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-8 animate-bounce" />
          <div className="h-8 bg-slate-100 rounded-full w-2/3 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-100 rounded-full w-1/2 mx-auto mb-12"></div>
          <div className="space-y-4">
            <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
            <div className="h-32 bg-slate-50 rounded-2xl w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
              <div className="h-14 bg-slate-50 rounded-2xl w-full"></div>
            </div>
          </div>
          <p className="mt-8 text-slate-400 font-medium">Preparing your professional profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Profile Header Block */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative z-10">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || user?.user_metadata?.full_name || 'User')}&background=2563eb&color=fff&bold=true`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -inset-2 bg-blue-600/20 blur-xl rounded-full group-hover:bg-blue-600/30 transition-all -z-0" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-center"
          >
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {formData.full_name || user?.user_metadata?.full_name || 'Your Profile'}
            </h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
              {formData.title || 'Professional Talent'}
            </p>
          </motion.div>
        </div>
        {/* Visual Step Indicator - Horizontal Milestone Tracker */}
        <div className="mb-10 flex items-center justify-center gap-2 md:gap-4 px-2 overflow-x-auto no-scrollbar">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2 group min-w-[60px]">
                <motion.div
                  animate={{
                    backgroundColor: currentStep >= step.id ? "rgba(37, 99, 235, 1)" : "rgba(255, 255, 255, 1)",
                    color: currentStep >= step.id ? "rgba(255, 255, 255, 1)" : "rgba(148, 163, 184, 1)",
                    scale: currentStep === step.id ? 1.15 : 1,
                    boxShadow: currentStep === step.id ? "0 10px 25px -5px rgba(37, 99, 235, 0.4)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    borderColor: currentStep >= step.id ? "rgba(37, 99, 235, 1)" : "rgba(226, 232, 240, 1)"
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border-2 transition-all cursor-default"
                >
                  {currentStep > step.id ? <Check size={18} strokeWidth={3} /> : <step.icon size={18} />}
                </motion.div>
                <span className={`text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-center transition-colors ${currentStep >= step.id ? "text-blue-600" : "text-slate-400"
                  }`}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="mx-1 md:mx-2 mb-5">
                  <div className="w-6 md:w-12 h-[2px] bg-slate-200 relative overflow-hidden rounded-full">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-blue-600"
                      initial={{ width: "0%" }}
                      animate={{ width: currentStep > step.id ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="mb-10 text-center">
              <motion.h1
                key={`h1-${currentStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-extrabold text-slate-900 tracking-tight"
              >
                {currentStep === 1 ? "Let's Get Started" :
                  currentStep === 2 ? "Showcase Your Expertise" :
                    "Final Connections"}
              </motion.h1>
              <p className="text-slate-500 mt-2 font-medium">
                {STEPS[currentStep - 1].description}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            <div className="flex justify-between pt-8 mt-10 border-t border-slate-100">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 px-6 py-4 font-bold transition-all rounded-2xl hover:bg-slate-50"
                >
                  <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                  Back
                </button>
              )}

              <div className="ml-auto">
                {currentStep < STEPS.length ? (
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={nextStep}
                    className="group flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200"
                  >
                    Next Step
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="relative overflow-hidden group flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white px-12 py-4 rounded-2xl font-black transition-all shadow-2xl shadow-blue-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Profile</span>
                        <Check size={20} strokeWidth={3} />
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12 text-slate-400 text-sm font-medium"
        >
          Need help? <a href="mailto:support@talentbrains.com" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-2 decoration-blue-100 hover:decoration-blue-600 transition-all font-bold">Talk to our career experts</a>
        </motion.p>
      </div>
    </div>
  );
}

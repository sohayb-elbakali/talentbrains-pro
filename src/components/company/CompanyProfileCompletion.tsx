import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Brain, Building, Globe, MapPin, Users, Calendar, Link2, Linkedin, Twitter, Facebook, ChevronRight, ChevronLeft, Check, User } from 'lucide-react';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase/index';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import Select from '../ui/Select';
import CheckboxGroup from '../ui/CheckboxGroup';

interface FormData {
  full_name: string;
  name: string;
  description: string;
  website: string;
  industry: string;
  company_size: string;
  location: string;
  founded_year: string;
  culture_values: string[];
  benefits: string[];
  social_links: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
}

const STEPS = [
  { id: 1, title: 'Company', icon: Building },
  { id: 2, title: 'Culture', icon: Users },
  { id: 3, title: 'Social', icon: Link2 },
];

const industryOptions = [
  "Technology", "Healthcare", "Finance", "Education", "Retail",
  "Manufacturing", "Consulting", "Media", "Real Estate",
  "Transportation", "Energy", "Government", "Non-profit", "Other",
].map(opt => ({ value: opt, label: opt }));

const companySizeOptions = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
].map(opt => ({ value: opt, label: `${opt} employees` }));

const cultureValueOptions = [
  "Innovation", "Collaboration", "Integrity", "Excellence",
  "Diversity", "Work-life balance", "Growth mindset",
  "Customer focus", "Transparency", "Sustainability",
];

const benefitOptions = [
  "Health insurance", "Dental insurance", "401(k)", "Paid time off",
  "Remote work", "Flexible hours", "Professional development",
  "Stock options", "Free meals", "Parental leave",
];

// Required field label component
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span>{children} <span className="text-red-500">*</span></span>
);

export default function CompanyProfileCompletion() {
  const { user, profile, loadUserProfile, setProfileCompletionStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [existingCompanyId, setExistingCompanyId] = useState<string | null>(null);
  const [existingSlug, setExistingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    name: "",
    description: "",
    website: "",
    industry: "",
    company_size: "",
    location: "",
    founded_year: "",
    culture_values: [],
    benefits: [],
    social_links: {
      linkedin: "",
      twitter: "",
      facebook: "",
    },
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
        const { data: companyData } = await db.getCompany(user.id);

        if (companyData) {
          setExistingCompanyId(companyData.id);
          setExistingSlug(companyData.slug);
          setFormData({
            full_name: profile?.full_name || '',
            name: companyData.name || "",
            description: companyData.description || "",
            website: companyData.website || "",
            industry: companyData.industry || "",
            company_size: companyData.company_size || "",
            location: companyData.location || "",
            founded_year: companyData.founded_year?.toString() || "",
            culture_values: companyData.culture_values || [],
            benefits: companyData.benefits || [],
            social_links: {
              linkedin: companyData.social_links?.linkedin || "",
              twitter: companyData.social_links?.twitter || "",
              facebook: companyData.social_links?.facebook || "",
            },
          });
        } else {
          setFormData(prev => ({ ...prev, full_name: profile?.full_name || '' }));
        }
      } catch (err) {
        console.error("Error fetching company data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, [user, profile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('social_links.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_links: { ...prev.social_links, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setHasUnsavedChanges(true);
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name.trim()) { notify.showError('Your name is required'); return false; }
        if (!formData.name.trim()) { notify.showError('Company name is required'); return false; }
        if (!formData.description.trim()) { notify.showError('Company description is required'); return false; }
        if (!formData.industry) { notify.showError('Industry is required'); return false; }
        if (!formData.company_size) { notify.showError('Company size is required'); return false; }
        if (!formData.location.trim()) { notify.showError('Location is required'); return false; }
        return true;
      case 2:
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

    if (!validateStep(1)) return;

    setLoading(true);
    try {
      // 1. Update profile full_name (user's personal name)
      const profileResult = await db.updateProfile(user.id, { full_name: formData.full_name.trim() });
      if (profileResult.error) {
        console.error('Profile update error:', profileResult.error);
      }

      // 2. Generate slug for new company or use existing
      const baseSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const uniqueSlug = existingSlug || `${baseSlug}-${Date.now().toString(36)}`;

      // 3. Prepare company data - convert empty strings to null for URL fields
      const companyData = {
        name: formData.name.trim(),
        slug: uniqueSlug,
        description: formData.description.trim(),
        website: formData.website.trim() || null,
        industry: formData.industry,
        company_size: formData.company_size,
        location: formData.location.trim(),
        founded_year: formData.founded_year ? Number(formData.founded_year) : null,
        culture_values: formData.culture_values,
        benefits: formData.benefits,
        social_links: {
          linkedin: formData.social_links.linkedin.trim() || null,
          twitter: formData.social_links.twitter.trim() || null,
          facebook: formData.social_links.facebook.trim() || null,
        },
      };

      let result;
      if (existingCompanyId) {
        result = await db.updateCompanyById(existingCompanyId, companyData);
      } else {
        result = await db.createCompany({ profile_id: user.id, ...companyData });
      }

      if (result.error) {
        let errorMessage = 'Failed to save company profile';
        if (result.error.code === '23505') {
          errorMessage = 'A company with this name already exists. Please try a different name.';
        } else if (result.error.message) {
          errorMessage = result.error.message;
        }
        throw new Error(errorMessage);
      }

      setHasUnsavedChanges(false);
      await loadUserProfile(user.id);
      notify.showSuccess("Company profile completed successfully!");
      setProfileCompletionStatus({ needsCompletion: false, type: 'company' });

      setTimeout(() => navigate('/company', { replace: true }), 300);
    } catch (error: any) {
      console.error('Error updating company profile:', error);
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
          <p className="text-slate-500 mb-4">You must be logged in to complete your company profile.</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Complete Company Profile</h1>
          <p className="text-slate-500 mt-1">Attract top talent to your team</p>
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
            {/* Step 1: Company Info */}
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
                    <Building size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
                </div>

                {/* User's Name Field */}
                <Input
                  label={<RequiredLabel>Your Name</RequiredLabel>}
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  leftIcon={<User size={18} className="text-slate-400" />}
                  helperText="This is your personal name (account holder)"
                />

                <Input
                  label={<RequiredLabel>Company Name</RequiredLabel>}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                  leftIcon={<Building size={18} className="text-slate-400" />}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label={<RequiredLabel>Industry</RequiredLabel>}
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    options={industryOptions}
                    placeholder="Select industry"
                  />
                  <Select
                    label={<RequiredLabel>Company Size</RequiredLabel>}
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleChange}
                    options={companySizeOptions}
                    placeholder="Team size"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={<RequiredLabel>Location</RequiredLabel>}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    leftIcon={<MapPin size={18} className="text-slate-400" />}
                  />
                  <Input
                    label="Founded Year"
                    type="number"
                    name="founded_year"
                    value={formData.founded_year}
                    onChange={handleChange}
                    placeholder="2020"
                    min={1800}
                    max={new Date().getFullYear()}
                    leftIcon={<Calendar size={18} className="text-slate-400" />}
                  />
                </div>

                <Input
                  label="Website"
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                  leftIcon={<Globe size={18} className="text-slate-400" />}
                />

                <Textarea
                  label={<RequiredLabel>About the Company</RequiredLabel>}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your company, mission, and culture..."
                  rows={4}
                />
              </motion.div>
            )}

            {/* Step 2: Culture & Benefits */}
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
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Culture & Benefits (Optional)</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Company Values</label>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
                    <CheckboxGroup
                      options={cultureValueOptions}
                      selectedValues={formData.culture_values}
                      onChange={(values) => {
                        setFormData(prev => ({ ...prev, culture_values: values }));
                        setHasUnsavedChanges(true);
                      }}
                      maxSelections={5}
                      columns={2}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Select up to 5 core values</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Benefits Offered</label>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
                    <CheckboxGroup
                      options={benefitOptions}
                      selectedValues={formData.benefits}
                      onChange={(values) => {
                        setFormData(prev => ({ ...prev, benefits: values }));
                        setHasUnsavedChanges(true);
                      }}
                      columns={2}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Social Links */}
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
                  <h2 className="text-lg font-semibold text-slate-900">Social Links (Optional)</h2>
                </div>

                <Input
                  label="LinkedIn"
                  type="url"
                  name="social_links.linkedin"
                  value={formData.social_links.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/company/..."
                  leftIcon={<Linkedin size={18} className="text-blue-600" />}
                />

                <Input
                  label="Twitter / X"
                  type="url"
                  name="social_links.twitter"
                  value={formData.social_links.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/..."
                  leftIcon={<Twitter size={18} className="text-sky-500" />}
                />

                <Input
                  label="Facebook"
                  type="url"
                  name="social_links.facebook"
                  value={formData.social_links.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/..."
                  leftIcon={<Facebook size={18} className="text-blue-700" />}
                />

                {/* Ready Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900">You're all set!</h3>
                  <p className="text-sm text-slate-600 mt-1">Your company profile is ready.</p>
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
                disabled={!formData.full_name || !formData.name || !formData.description || !formData.industry || !formData.company_size || !formData.location}
              >
                Complete Profile <Check size={18} className="ml-1" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          You can update your company profile anytime from settings
        </p>
      </motion.div>
    </div>
  );
}

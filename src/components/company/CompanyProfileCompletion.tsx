import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Building, Globe, Users, MapPin, Calendar, Link2, Linkedin, Twitter, Facebook, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { notify } from "../../utils/notify";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase/index';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import CheckboxGroup from '../ui/CheckboxGroup';

interface FormData {
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
    website: string;
  };
}

export default function CompanyProfileCompletion() {
  const { user, loadUserProfile, setProfileCompletionStatus } = useAuth();
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
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
      website: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        console.log('Fetching existing company data for user:', user.id);
        const { data: companyData } = await db.getCompany(user.id);

        if (companyData) {
          console.log('Found existing company data:', companyData);
          setFormData({
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
              website: companyData.social_links?.website || "",
            },
          });
        } else {
          // No company data yet, fields stay empty
        }
      } catch (err) {
        console.error("Error fetching company data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, [user]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Options
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
    "Agility", "Respect",
  ];

  const benefitOptions = [
    "Health insurance", "Dental insurance", "Vision insurance",
    "401(k)", "Paid time off", "Remote work", "Flexible hours",
    "Professional development", "Stock options", "Gym membership",
    "Free meals", "Commuter benefits", "Parental leave",
    "Mental health support",
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900">User not found</h2>
          <p className="text-gray-600 mb-4">You must be logged in to complete your company profile.</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    )
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Company name is required";
      if (!formData.description.trim())
        newErrors.description = "Company description is required";
      if (!formData.industry) newErrors.industry = "Industry is required";
      if (!formData.company_size)
        newErrors.company_size = "Company size is required";
      if (!formData.location.trim())
        newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    } else {
      notify.showError("Please fill in all required fields correctly");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) { notify.showError("Company name is required"); setCurrentStep(1); return; }
    if (!formData.description) { notify.showError("Description is required"); setCurrentStep(1); return; }
    if (!formData.industry) { notify.showError("Industry is required"); setCurrentStep(1); return; }
    if (!formData.company_size) { notify.showError("Company size is required"); setCurrentStep(1); return; }
    if (!formData.location) { notify.showError("Location is required"); setCurrentStep(1); return; }

    setLoading(true)
    try {
      const baseSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      const { data: existingCompany } = await db.getCompany(user.id);

      const socialLinks = {
        linkedin: formData.social_links?.linkedin || "",
        twitter: formData.social_links?.twitter || "",
        facebook: formData.social_links?.facebook || "",
        website: formData.social_links?.website || "",
      };

      const companyData = {
        name: formData.name,
        slug: existingCompany ? existingCompany.slug : uniqueSlug,
        description: formData.description,
        website: formData.website || null,
        industry: formData.industry,
        company_size: formData.company_size,
        location: formData.location,
        founded_year: formData.founded_year
          ? Number(formData.founded_year)
          : null,
        culture_values: formData.culture_values || [],
        benefits: formData.benefits || [],
        social_links: socialLinks,
      };

      let result;
      if (existingCompany) {
        result = await db.updateCompany(user.id, companyData);
      } else {
        result = await db.createCompany({
          profile_id: user.id,
          ...companyData,
        });
      }

      if (result.error) {
        console.error('Database error:', result.error);
        let errorMessage = 'Failed to save company profile';

        if (result.error.code === '23505') {
          errorMessage = 'A company with this name already exists. Please try a different name.';
        } else if (result.error.code === '406' || result.error.status === 406) {
          errorMessage = 'Invalid data format. Please check your inputs.';
        } else if (result.error.code === '409' || result.error.status === 409) {
          errorMessage = 'This company profile conflicts with an existing one.';
        } else if (result.error.message) {
          errorMessage = result.error.message;
        }

        throw new Error(errorMessage);
      }

      // Load user profile from scratch to ensure all states are fresh
      await loadUserProfile(user.id);

      notify.showSuccess("Company profile completed successfully!");

      // Manually set completion status to false to prevent race conditions with ProtectedRoute
      setProfileCompletionStatus({ needsCompletion: false, type: 'company' });

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate('/company', { replace: true });
      }, 300);
    } catch (error: any) {
      console.error('Error updating company profile:', error)
      const errorMessage = error?.message || 'Failed to save company profile. Please try again.';
      notify.showError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl border border-slate-200 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-8"></div>
          <div className="space-y-6">
            <div className="h-12 bg-slate-100 rounded"></div>
            <div className="h-32 bg-slate-100 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-slate-100 rounded"></div>
              <div className="h-12 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl text-center">
        {/* Visual Step Indicator - Horizontal Dots & Icons */}
        <div className="mb-10 flex items-center justify-center gap-4">
          {[
            { id: 1, icon: Building, label: "Identity" },
            { id: 2, icon: Calendar, label: "Details" },
            { id: 3, icon: Link2, label: "Social" }
          ].map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2 group">
                <motion.div
                  animate={{
                    backgroundColor: currentStep >= step.id ? "rgba(37, 99, 235, 1)" : "rgba(255, 255, 255, 1)",
                    color: currentStep >= step.id ? "rgba(255, 255, 255, 1)" : "rgba(148, 163, 184, 1)",
                    scale: currentStep === step.id ? 1.1 : 1,
                    boxShadow: currentStep === step.id ? "0 10px 25px -5px rgba(37, 99, 235, 0.4)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${currentStep >= step.id ? "border-blue-600" : "border-slate-200"
                    }`}
                >
                  {currentStep > step.id ? <Check size={20} strokeWidth={3} /> : <step.icon size={20} />}
                </motion.div>
                <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${currentStep >= step.id ? "text-blue-600" : "text-slate-400"
                  }`}>
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div className="mx-4 mb-5">
                  <div className="w-12 md:w-20 h-[2px] bg-slate-200 relative overflow-hidden rounded-full">
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

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
          <div className="p-8 md:p-12">
            <div className="mb-10 text-center">
              <motion.h1
                key={currentStep === 1 ? 'h1-1' : currentStep === 2 ? 'h1-2' : 'h1-3'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-extrabold text-slate-900 tracking-tight"
              >
                {currentStep === 1 ? "Start Your Journey" : currentStep === 2 ? "A Bit More About You" : "Connect Your World"}
              </motion.h1>
              <p className="text-slate-500 mt-2 font-medium">
                {currentStep === 1
                  ? "Let's capture the core identity of your company."
                  : currentStep === 2
                    ? "Tell us what makes your workplace unique."
                    : "Make it easy for talents to find and follow you."}
              </p>
            </div>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Building size={20} />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <Input
                        label="Company Name"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        error={errors.name}
                        placeholder="e.g. Acme Corporation"
                        leftIcon={<Building size={18} className="text-blue-500" />}
                        className="!bg-slate-50/50 focus:!bg-white px-4 py-3"
                        helperText="Use your registration name"
                      />

                      <Textarea
                        label="About the Company"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        error={errors.description}
                        placeholder="Tell the world about your mission, values, and what you build..."
                        rows={5}
                        className="resize-none !bg-slate-50/50 focus:!bg-white p-4"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                          label="Industry"
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          options={industryOptions}
                          error={errors.industry}
                          placeholder="Select industry"
                          className="!bg-slate-50/50 focus:!bg-white"
                        />

                        <Select
                          label="Company Size"
                          id="company_size"
                          name="company_size"
                          value={formData.company_size}
                          onChange={handleInputChange}
                          options={companySizeOptions}
                          error={errors.company_size}
                          placeholder="Team size"
                          className="!bg-slate-50/50 focus:!bg-white"
                        />
                      </div>

                      <Input
                        label="Headquarters"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        error={errors.location}
                        placeholder="e.g. London, United Kingdom"
                        leftIcon={<MapPin size={18} className="text-red-400" />}
                        className="!bg-slate-50/50 focus:!bg-white px-4 py-3"
                      />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                      <motion.button
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleNext}
                        className="group flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                      >
                        Next Step
                        <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                      <Calendar size={20} />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">Additional Details</h2>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Company Website"
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://acme.co"
                        leftIcon={<Globe size={18} className="text-indigo-500" />}
                        className="!bg-slate-50/50 focus:!bg-white px-4 py-3"
                      />

                      <Input
                        label="Year Founded"
                        type="number"
                        id="founded_year"
                        name="founded_year"
                        value={formData.founded_year}
                        onChange={handleInputChange}
                        min="1800"
                        max={new Date().getFullYear()}
                        placeholder="2024"
                        leftIcon={<Calendar size={18} className="text-amber-500" />}
                        className="!bg-slate-50/50 focus:!bg-white px-4 py-3"
                      />
                    </div>

                    <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 space-y-6 border border-slate-100/50">
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                          <Users size={16} className="text-blue-500" />
                          Workplace Culture
                        </label>
                        <CheckboxGroup
                          options={cultureValueOptions}
                          selectedValues={formData.culture_values || []}
                          onChange={(values) => setFormData(prev => ({ ...prev, culture_values: values }))}
                          maxSelections={5}
                          columns={2}
                        />
                        <p className="text-[10px] text-slate-400 font-medium">Select up to 5 values that represent your team best.</p>
                      </div>

                      <div className="h-px bg-slate-200/50 w-full" />

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                          <Check size={16} className="text-emerald-500" />
                          Exclusive Benefits
                        </label>
                        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          <CheckboxGroup
                            options={benefitOptions}
                            selectedValues={formData.benefits || []}
                            onChange={(values) => setFormData(prev => ({ ...prev, benefits: values }))}
                            columns={2}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 px-6 py-4 font-bold transition-all rounded-2xl hover:bg-slate-50"
                      >
                        <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleNext}
                        className="group flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                      >
                        Continue
                        <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <Globe size={20} />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">Social Connections</h2>
                  </div>

                  <div className="space-y-5">
                    <Input
                      label="LinkedIn"
                      type="url"
                      name="social_links.linkedin"
                      value={formData.social_links.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/company/..."
                      leftIcon={<Linkedin size={18} className="text-[#0A66C2]" />}
                      className="!bg-[#0A66C2]/5 focus:!bg-white px-4 py-3"
                    />
                    <Input
                      label="Twitter / X"
                      type="url"
                      name="social_links.twitter"
                      value={formData.social_links.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/..."
                      leftIcon={<Twitter size={18} className="text-[#1DA1F2]" />}
                      className="!bg-[#1DA1F2]/5 focus:!bg-white px-4 py-3"
                    />
                    <Input
                      label="Facebook"
                      type="url"
                      name="social_links.facebook"
                      value={formData.social_links.facebook}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/..."
                      leftIcon={<Facebook size={18} className="text-[#1877F2]" />}
                      className="!bg-[#1877F2]/5 focus:!bg-white px-4 py-3"
                    />
                  </div>

                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-[2rem] p-8 mt-8 flex flex-col items-center text-center gap-4"
                  >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Check size={32} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-emerald-900 text-xl font-bold">You're all set!</h4>
                      <p className="text-emerald-700/80 font-medium mt-1">
                        Your profile is ready to inspire top talents.
                      </p>
                    </div>
                  </motion.div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 px-6 py-4 font-bold transition-all rounded-2xl hover:bg-slate-50"
                    >
                      <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="relative overflow-hidden group flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white px-12 py-4 rounded-2xl font-black transition-all shadow-2xl shadow-blue-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Finalizing...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Profile</span>
                          <Check size={20} strokeWidth={3} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12 text-slate-400 text-sm font-medium"
        >
          Need assistance? <a href="mailto:support@talentbrains.com" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-2 decoration-blue-100 hover:decoration-blue-600 transition-all font-bold">Contact our support team</a>
        </motion.p>
      </div>
    </div>
  );
}


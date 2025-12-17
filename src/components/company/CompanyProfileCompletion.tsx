import { motion } from 'framer-motion';
import { useState } from 'react';
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
  const { user, profile, checkProfileCompletion } = useAuth();
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

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

      await checkProfileCompletion(true)
      notify.showSuccess("Company profile completed successfully!");
      navigate('/company')
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl border border-slate-200"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Complete Your Company Profile
          </h1>
          <p className="text-slate-600">
            Tell us about your company to get started
          </p>
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <div className={`h-2.5 w-2.5 rounded-full ${currentStep >= 1 ? "bg-primary" : "bg-slate-200"}`} />
              <div className={`h-1 w-8 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-slate-200"}`} />
              <div className={`h-2.5 w-2.5 rounded-full ${currentStep >= 2 ? "bg-primary" : "bg-slate-200"}`} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                Basic Information
              </h2>

              <Input
                label="Company Name"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                placeholder="Enter your company name"
              />

              <Textarea
                label="Company Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                error={errors.description}
                placeholder="Describe what your company does"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Industry"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  options={industryOptions}
                  error={errors.industry}
                  placeholder="Select an industry"
                />

                <Select
                  label="Company Size"
                  id="company_size"
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleInputChange}
                  options={companySizeOptions}
                  error={errors.company_size}
                  placeholder="Select company size"
                />
              </div>

              <Input
                label="Location"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                error={errors.location}
                placeholder="e.g., San Francisco, CA"
              />

              <div className="flex justify-end pt-4">
                <Button type="button" onClick={handleNext}>
                  Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                Additional Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Website"
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourcompany.com"
                />

                <Input
                  label="Founded Year"
                  type="number"
                  id="founded_year"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleInputChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2015"
                />
              </div>

              {/* Culture Values */}
              <CheckboxGroup
                label="Culture Values (Select up to 5)"
                options={cultureValueOptions}
                selectedValues={formData.culture_values || []}
                onChange={(values) => setFormData(prev => ({ ...prev, culture_values: values }))}
                maxSelections={5}
                columns={2}
              />

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Benefits Offered
                </label>
                <div className="max-h-60 overflow-y-auto pr-2">
                  <CheckboxGroup
                    options={benefitOptions}
                    selectedValues={formData.benefits || []}
                    onChange={(values) => setFormData(prev => ({ ...prev, benefits: values }))}
                    columns={2}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Social Media Links
                </label>
                <div className="space-y-4">
                  <Input
                    type="url"
                    name="social_links.linkedin"
                    value={formData.social_links.linkedin}
                    onChange={handleInputChange}
                    placeholder="LinkedIn URL"
                    leftIcon={<span className="text-xs font-bold text-slate-400">IN</span>}
                  />
                  <Input
                    type="url"
                    name="social_links.twitter"
                    value={formData.social_links.twitter}
                    onChange={handleInputChange}
                    placeholder="Twitter URL"
                    leftIcon={<span className="text-xs font-bold text-slate-400">TW</span>}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="secondary" type="button" onClick={handleBack}>
                  Back
                </Button>
                <Button type="submit" loading={loading}>
                  Complete Profile
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}


import { motion } from 'framer-motion';
import { useState } from 'react';
import { notificationManager } from "../../utils/notificationManager";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase';

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
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Consulting",
    "Media",
    "Real Estate",
    "Transportation",
    "Energy",
    "Government",
    "Non-profit",
    "Other",
  ];

  const companySizeOptions = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1000+",
  ];

  const cultureValueOptions = [
    "Innovation",
    "Collaboration",
    "Integrity",
    "Excellence",
    "Diversity",
    "Work-life balance",
    "Growth mindset",
    "Customer focus",
    "Transparency",
    "Sustainability",
    "Agility",
    "Respect",
  ];

  const benefitOptions = [
    "Health insurance",
    "Dental insurance",
    "Vision insurance",
    "401(k)",
    "Paid time off",
    "Remote work",
    "Flexible hours",
    "Professional development",
    "Stock options",
    "Gym membership",
    "Free meals",
    "Commuter benefits",
    "Parental leave",
    "Mental health support",
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900">User not found</h2>
          <p className="text-gray-600 mb-4">You must be logged in to complete your company profile.</p>
          <a href="/" className="text-purple-600 hover:underline">Go to Home</a>
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
      // Generate a unique slug by appending a random string
      const baseSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      
      // Add timestamp or random string to ensure uniqueness
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      const { data: existingCompany } = await db.getCompany(user.id);

      // Ensure social_links is a proper object (not undefined or null)
      const socialLinks = {
        linkedin: formData.social_links?.linkedin || "",
        twitter: formData.social_links?.twitter || "",
        facebook: formData.social_links?.facebook || "",
        website: formData.social_links?.website || "",
      };

      const companyData = {
        name: formData.name,
        slug: existingCompany ? existingCompany.slug : uniqueSlug, // Keep existing slug if updating
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
        
        // Provide specific error messages based on error code
        let errorMessage = 'Failed to save company profile';
        
        if (result.error.code === '23505') {
          // Unique constraint violation
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

      // Force refresh of profile completion status
      await checkProfileCompletion(true)

      notificationManager.showSuccess("Company profile completed successfully!");
      navigate('/company')
    } catch (error: any) {
      console.error('Error updating company profile:', error)
      const errorMessage = error?.message || 'Failed to save company profile. Please try again.';
      notificationManager.showError(errorMessage);
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

  const handleArrayToggle = (
    arrayName: "culture_values" | "benefits",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(value)
        ? prev[arrayName].filter((item) => item !== value)
        : [...prev[arrayName], value],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Company Profile
          </h1>
          <p className="text-gray-600">
            Tell us about your company to get started
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? "bg-purple-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>

              {/* Company Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your company name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Describe what your company does"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label
                  htmlFor="industry"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Industry *
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.industry ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select an industry</option>
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                )}
              </div>

              {/* Company Size */}
              <div>
                <label
                  htmlFor="company_size"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Size *
                </label>
                <select
                  id="company_size"
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.company_size ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select company size</option>
                  {companySizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} employees
                    </option>
                  ))}
                </select>
                {errors.company_size && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.company_size}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.location ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., San Francisco, CA"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Details
              </h2>

              {/* Website */}
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://yourcompany.com"
                />
              </div>

              {/* Founded Year */}
              <div>
                <label
                  htmlFor="founded_year"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Founded Year
                </label>
                <input
                  type="number"
                  id="founded_year"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleInputChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 2015"
                />
              </div>

              {/* Culture Values */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Culture Values (Select up to 5)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {cultureValueOptions.map((value) => (
                    <label
                      key={value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.culture_values.includes(value)}
                        onChange={() =>
                          handleArrayToggle("culture_values", value)
                        }
                        disabled={
                          formData.culture_values.length >= 5 &&
                          !formData.culture_values.includes(value)
                        }
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{value}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefits Offered (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {benefitOptions.map((benefit) => (
                    <label
                      key={benefit}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.benefits.includes(benefit)}
                        onChange={() => handleArrayToggle("benefits", benefit)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media Links
                </label>
                <div className="space-y-3">
                  <input
                    type="url"
                    name="social_links.linkedin"
                    value={formData.social_links.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="LinkedIn URL"
                  />
                  <input
                    type="url"
                    name="social_links.twitter"
                    value={formData.social_links.twitter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Twitter URL"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Saving..." : "Complete Profile"}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

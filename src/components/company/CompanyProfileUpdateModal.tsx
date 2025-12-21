import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building, Globe, MapPin, Users, Calendar, Link2, Linkedin, Twitter, Facebook, User } from "lucide-react";
import { notify } from "../../utils/notify";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import { Company, CompanyUpdateData } from "../../types/database";
import { validateCompanyProfile } from "../../utils/profileValidation";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import CheckboxGroup from "../ui/CheckboxGroup";
import ProfileUpdateModal from "../profile/ProfileUpdateModal";

interface CompanyProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (company: Company) => void;
}

// Required field label component
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span>{children} <span className="text-red-500">*</span></span>
);

export default function CompanyProfileUpdateModal({
  isOpen,
  onClose,
  onUpdate,
}: CompanyProfileUpdateModalProps) {
  const { user, profile } = useAuth();
  const { data, refetch } = useUserData(user?.id);
  const queryClient = useQueryClient();
  const company = data?.company;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Profile name (stored in profiles table - account holder's name)
  const [fullName, setFullName] = useState("");

  // Company data (stored in companies table)
  const [formData, setFormData] = useState<CompanyUpdateData>({
    name: "",
    description: "",
    website: "",
    industry: "",
    company_size: "",
    location: "",
    founded_year: undefined,
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
    { value: "Technology", label: "Technology" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Finance", label: "Finance" },
    { value: "Education", label: "Education" },
    { value: "Retail", label: "Retail" },
    { value: "Manufacturing", label: "Manufacturing" },
    { value: "Consulting", label: "Consulting" },
    { value: "Media", label: "Media" },
    { value: "Real Estate", label: "Real Estate" },
    { value: "Transportation", label: "Transportation" },
    { value: "Energy", label: "Energy" },
    { value: "Government", label: "Government" },
    { value: "Non-profit", label: "Non-profit" },
    { value: "Other", label: "Other" },
  ];

  const companySizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" },
  ];

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
    "Free meals", "Commuter benefits", "Parental leave", "Mental health support",
  ];

  // Load existing company data
  useEffect(() => {
    if (isOpen) {
      // Load profile name
      setFullName(profile?.full_name || "");

      if (company) {
        setCompanyId(company.id);
        setFormData({
          name: company.name || "",
          description: company.description || "",
          website: company.website || "",
          industry: company.industry || "",
          company_size: company.company_size || "",
          location: company.location || "",
          founded_year: company.founded_year || undefined,
          culture_values: company.culture_values || [],
          benefits: company.benefits || [],
          social_links: {
            linkedin: company.social_links?.linkedin || "",
            twitter: company.social_links?.twitter || "",
            facebook: company.social_links?.facebook || "",
            website: company.social_links?.website || "",
          },
        });
      }
      setInitialLoading(false);
    }
  }, [isOpen, company, profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.full_name = "Your name is required";
    }

    const validation = validateCompanyProfile(formData);
    Object.assign(newErrors, validation.errors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CompanyUpdateData] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "founded_year" ? (value ? Number(value) : undefined) : value,
      }));
    }

    setHasUnsavedChanges(true);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleArrayChange = (field: "culture_values" | "benefits", values: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: values }));
    setHasUnsavedChanges(true);
  };

  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value === undefined || value === "") {
        // Convert empty strings and undefined to null (important for URL fields with constraints)
        sanitized[key] = null;
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    });
    delete sanitized.id;
    return sanitized;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      // 1. Update profile name first (account holder's name)
      const profileResult = await db.updateProfile(user.id, { full_name: fullName.trim() });
      if (profileResult.error) {
        console.error("Profile update error:", profileResult.error);
        // Don't block - continue with company update
      }

      // 2. Update or create company
      let result;
      const sanitizedData = sanitizeData(formData);

      if (companyId) {
        result = await db.updateCompanyById(companyId, sanitizedData);
      } else {
        // Generate slug for new company
        const baseSlug = formData.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        result = await db.createCompany({
          profile_id: user.id,
          slug: uniqueSlug,
          ...sanitizedData,
        });
      }

      const { data: resultData, error } = result;
      if (error) {
        let errorMessage = "Failed to save company profile";
        if (error.code === "23505") {
          errorMessage = "A company with this name already exists.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      // 3. Refresh all related queries
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['user-data'] }),
        queryClient.invalidateQueries({ queryKey: ['company'] }),
        queryClient.invalidateQueries({ queryKey: ['company-jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['welcome-dashboard'] }),
      ]);

      notify.showSuccess("Company profile updated successfully!");
      setHasUnsavedChanges(false);

      if (onUpdate && resultData) {
        onUpdate(resultData);
      }

      onClose();
    } catch (error: any) {
      console.error("Error updating company profile:", error);
      notify.showError(error?.message || "Failed to update company profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setHasUnsavedChanges(false);
    onClose();
  };

  if (initialLoading) {
    return (
      <ProfileUpdateModal
        isOpen={isOpen}
        onClose={onClose}
        title="Update Company Profile"
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading company data...</span>
        </div>
      </ProfileUpdateModal>
    );
  }

  return (
    <ProfileUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Company Profile"
      loading={loading}
      onSave={handleSave}
      onCancel={handleCancel}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <div className="p-6 space-y-8">
        {/* Account Holder Information */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <User size={18} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Account Holder</h3>
          </div>

          <Input
            label={<RequiredLabel>Your Name</RequiredLabel>}
            name="full_name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setHasUnsavedChanges(true);
              if (errors.full_name) setErrors(prev => ({ ...prev, full_name: "" }));
            }}
            placeholder="Your full name (account holder)"
            error={errors.full_name}
            leftIcon={<User size={18} className="text-slate-400" />}
            helperText="This is your personal name as the account manager"
          />
        </div>

        {/* Company Information */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building size={18} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Company Information</h3>
          </div>

          <Input
            label={<RequiredLabel>Company Name</RequiredLabel>}
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your company name"
            error={errors.name}
            leftIcon={<Building size={18} className="text-slate-400" />}
          />

          <Textarea
            label={<RequiredLabel>Description</RequiredLabel>}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            placeholder="Describe what your company does"
            error={errors.description}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label={<RequiredLabel>Industry</RequiredLabel>}
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              options={industryOptions}
              placeholder="Select an industry"
              error={errors.industry}
            />

            <Select
              label={<RequiredLabel>Company Size</RequiredLabel>}
              name="company_size"
              value={formData.company_size}
              onChange={handleInputChange}
              options={companySizeOptions}
              placeholder="Select company size"
              error={errors.company_size}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label={<RequiredLabel>Location</RequiredLabel>}
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., San Francisco, CA"
              error={errors.location}
              leftIcon={<MapPin size={18} className="text-slate-400" />}
            />

            <Input
              label="Founded Year"
              type="number"
              name="founded_year"
              value={formData.founded_year || ""}
              onChange={handleInputChange}
              min="1800"
              max={new Date().getFullYear()}
              placeholder="e.g., 2015"
              error={errors.founded_year ? String(errors.founded_year) : undefined}
              leftIcon={<Calendar size={18} className="text-slate-400" />}
            />
          </div>

          <Input
            label="Website"
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://yourcompany.com"
            error={errors.website}
            leftIcon={<Globe size={18} className="text-slate-400" />}
          />
        </div>

        {/* Culture & Values */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Culture & Values</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Values
            </label>
            <p className="text-sm text-slate-500 mb-3">Select up to 5 values that represent your company culture</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
              <CheckboxGroup
                options={cultureValueOptions}
                selectedValues={formData.culture_values || []}
                onChange={(values) => handleArrayChange("culture_values", values)}
                maxSelections={5}
                columns={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Benefits Offered
            </label>
            <p className="text-sm text-slate-500 mb-3">Select all benefits that your company offers</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
              <CheckboxGroup
                options={benefitOptions}
                selectedValues={formData.benefits || []}
                onChange={(values) => handleArrayChange("benefits", values)}
                columns={2}
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center">
              <Link2 size={18} className="text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Social Links</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="LinkedIn"
              type="url"
              name="social_links.linkedin"
              value={formData.social_links?.linkedin || ""}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/company/..."
              leftIcon={<Linkedin size={18} className="text-blue-600" />}
            />

            <Input
              label="Twitter / X"
              type="url"
              name="social_links.twitter"
              value={formData.social_links?.twitter || ""}
              onChange={handleInputChange}
              placeholder="https://twitter.com/..."
              leftIcon={<Twitter size={18} className="text-sky-500" />}
            />

            <Input
              label="Facebook"
              type="url"
              name="social_links.facebook"
              value={formData.social_links?.facebook || ""}
              onChange={handleInputChange}
              placeholder="https://facebook.com/..."
              leftIcon={<Facebook size={18} className="text-blue-700" />}
            />

            <Input
              label="Additional Website"
              type="url"
              name="social_links.website"
              value={formData.social_links?.website || ""}
              onChange={handleInputChange}
              placeholder="https://additional-site.com"
              leftIcon={<Globe size={18} className="text-slate-400" />}
            />
          </div>
        </div>
      </div>
    </ProfileUpdateModal>
  );
}

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationManager } from "../../utils/notificationManager";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase";
import { Company, CompanyUpdateData } from "../../types/database";
import { validateCompanyProfile } from "../../utils/profileValidation";
import FormField, {
  CheckboxGroup,
  Input,
  Select,
  Textarea,
} from "../profile/FormField";
import ProfileUpdateModal from "../profile/ProfileUpdateModal";

interface CompanyProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (company: Company) => void;
}

export default function CompanyProfileUpdateModal({
  isOpen,
  onClose,
  onUpdate,
}: CompanyProfileUpdateModalProps) {
  const { user } = useAuth();
  const { data, refetch } = useUserData(user?.id);
  const queryClient = useQueryClient();
  const company = data?.company;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
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

  // Load existing company data
  useEffect(() => {
    if (isOpen && company) {
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
      setInitialLoading(false);
    }
  }, [isOpen, company]);



  const validateForm = () => {
    const validation = validateCompanyProfile(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

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
          ...(prev[parent as keyof CompanyUpdateData] as Record<
            string,
            string
          >),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "founded_year" ? (value ? Number(value) : undefined) : value,
      }));
    }

    setHasUnsavedChanges(true);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleArrayChange = (
    field: "culture_values" | "benefits",
    values: string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: values }));
    setHasUnsavedChanges(true);
  };

  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        sanitized[key] = null;
      } else if (
        typeof data[key] === "object" &&
        data[key] !== null &&
        !Array.isArray(data[key])
      ) {
        sanitized[key] = sanitizeData(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    });
    // Remove id if present
    delete sanitized.id;
    return sanitized;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      let result;
      const sanitizedData = sanitizeData(formData);
      if (companyId) {
        // Update by id
        result = await db.updateCompanyById(companyId, sanitizedData);
      } else {
        // Create new company
        result = await db.createCompany({
          profile_id: user.id,
          ...sanitizedData,
        });
      }

      const { data, error } = result;
      if (error) {
        throw error;
      }

      // Invalidate all related queries to refresh data everywhere
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['user-data'] }),
        queryClient.invalidateQueries({ queryKey: ['company'] }),
        queryClient.invalidateQueries({ queryKey: ['company-jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['company-applications'] }),
        queryClient.invalidateQueries({ queryKey: ['welcome-dashboard'] }),
      ]);

      notificationManager.showSuccess("Company profile updated successfully!");
      setHasUnsavedChanges(false);

      if (onUpdate && data) {
        onUpdate(data);
      } else {
        // Call onUpdate without data to trigger parent refetch
        onUpdate?.(data);
      }

      onClose();
    } catch (error) {
      console.error("Error updating company profile:", error);
      toast.error("Failed to update company profile. Please try again.");
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>

          <FormField label="Company Name" required error={errors.name}>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your company name"
              error={!!errors.name}
            />
          </FormField>

          <FormField label="Description" required error={errors.description}>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe what your company does"
              error={!!errors.description}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Industry" required error={errors.industry}>
              <Select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                options={industryOptions}
                placeholder="Select an industry"
                error={!!errors.industry}
              />
            </FormField>

            <FormField
              label="Company Size"
              required
              error={errors.company_size}
            >
              <Select
                name="company_size"
                value={formData.company_size}
                onChange={handleInputChange}
                options={companySizeOptions}
                placeholder="Select company size"
                error={!!errors.company_size}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Location" required error={errors.location}>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., San Francisco, CA"
                error={!!errors.location}
              />
            </FormField>

            <FormField label="Founded Year" error={errors.founded_year}>
              <Input
                type="number"
                name="founded_year"
                value={formData.founded_year || ""}
                onChange={handleInputChange}
                min="1800"
                max={new Date().getFullYear()}
                placeholder="e.g., 2015"
                error={!!errors.founded_year}
              />
            </FormField>
          </div>

          <FormField label="Website" error={errors.website}>
            <Input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://yourcompany.com"
              error={!!errors.website}
            />
          </FormField>
        </div>

        {/* Culture & Values */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Culture & Values
          </h3>

          <FormField
            label="Culture Values"
            description="Select up to 5 values that represent your company culture"
          >
            <CheckboxGroup
              options={cultureValueOptions}
              selectedValues={formData.culture_values || []}
              onChange={(values) => handleArrayChange("culture_values", values)}
              maxSelections={5}
              columns={2}
            />
          </FormField>

          <FormField
            label="Benefits Offered"
            description="Select all benefits that your company offers"
          >
            <div className="max-h-40 overflow-y-auto">
              <CheckboxGroup
                options={benefitOptions}
                selectedValues={formData.benefits || []}
                onChange={(values) => handleArrayChange("benefits", values)}
                columns={2}
              />
            </div>
          </FormField>
        </div>

        {/* Social Media Links */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Social Media Links
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="LinkedIn URL">
              <Input
                type="url"
                name="social_links.linkedin"
                value={formData.social_links?.linkedin || ""}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </FormField>

            <FormField label="Twitter URL">
              <Input
                type="url"
                name="social_links.twitter"
                value={formData.social_links?.twitter || ""}
                onChange={handleInputChange}
                placeholder="https://twitter.com/yourcompany"
              />
            </FormField>

            <FormField label="Facebook URL">
              <Input
                type="url"
                name="social_links.facebook"
                value={formData.social_links?.facebook || ""}
                onChange={handleInputChange}
                placeholder="https://facebook.com/yourcompany"
              />
            </FormField>

            <FormField label="Additional Website">
              <Input
                type="url"
                name="social_links.website"
                value={formData.social_links?.website || ""}
                onChange={handleInputChange}
                placeholder="https://additional-site.com"
              />
            </FormField>
          </div>
        </div>
      </div>
    </ProfileUpdateModal>
  );
}

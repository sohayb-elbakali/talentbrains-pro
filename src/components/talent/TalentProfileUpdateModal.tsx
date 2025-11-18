import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationManager } from "../../utils/notificationManager";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import {
  AvailabilityStatus,
  ExperienceLevel,
  Talent,
  TalentUpdateData,
} from "../../types/database";
import { validateTalentProfile } from "../../utils/profileValidation";
import FormField, {
  CheckboxGroup,
  Input,
  Select,
  Textarea,
} from "../profile/FormField";
import ProfileUpdateModal from "../profile/ProfileUpdateModal";
import SkillsSelector from "../skills/SkillsSelector";

interface TalentProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (talent: Talent) => void;
}

export default function TalentProfileUpdateModal({
  isOpen,
  onClose,
  onUpdate,
}: TalentProfileUpdateModalProps) {
  const { user } = useAuth();
  const { data, refetch } = useUserData(user?.id);
  const queryClient = useQueryClient();
  const talent = data?.talent;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<TalentUpdateData>({
    title: "",
    bio: "",
    location: "",
    remote_preference: true,
    experience_level: "mid",
    years_of_experience: 0,
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    salary_expectation_min: undefined,
    salary_expectation_max: undefined,
    availability_status: "available",
    portfolio_url: "",
    resume_url: "",
    github_url: "",
    linkedin_url: "",
    languages: ["English"],
    timezone: "UTC",
    work_authorization: "",
    education: [],
    certifications: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<any[]>([]);

  // Options
  const experienceLevels: Array<{ value: ExperienceLevel; label: string }> = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (6-10 years)" },
    { value: "lead", label: "Lead/Principal (10+ years)" },
  ];

  const availabilityOptions: Array<{
    value: AvailabilityStatus;
    label: string;
  }> = [
      { value: "available", label: "Available" },
      { value: "open_to_offers", label: "Open to offers" },
      { value: "not_looking", label: "Not looking" },
    ];

  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Russian",
    "Hindi",
  ];

  const timezoneOptions = [
    { value: "UTC", label: "UTC" },
    { value: "EST", label: "EST (Eastern)" },
    { value: "CST", label: "CST (Central)" },
    { value: "MST", label: "MST (Mountain)" },
    { value: "PST", label: "PST (Pacific)" },
    { value: "GMT", label: "GMT (Greenwich)" },
    { value: "CET", label: "CET (Central European)" },
    { value: "JST", label: "JST (Japan)" },
    { value: "IST", label: "IST (India)" },
    { value: "AEST", label: "AEST (Australia Eastern)" },
  ];

  const workAuthOptions = [
    { value: "US Citizen", label: "US Citizen" },
    { value: "Green Card Holder", label: "Green Card Holder" },
    { value: "H1B Visa", label: "H1B Visa" },
    { value: "F1 Visa (OPT)", label: "F1 Visa (OPT)" },
    { value: "L1 Visa", label: "L1 Visa" },
    { value: "O1 Visa", label: "O1 Visa" },
    { value: "No US Work Authorization", label: "No US Work Authorization" },
    { value: "EU Citizen", label: "EU Citizen" },
    { value: "Other", label: "Other" },
  ];

  // Load existing talent data and skills
  useEffect(() => {
    const loadTalentData = async () => {
      if (isOpen && talent) {
        setFormData({
          title: talent.title || "",
          bio: talent.bio || "",
          location: talent.location || "",
          remote_preference: talent.remote_preference ?? true,
          experience_level: talent.experience_level || "mid",
          years_of_experience: talent.years_of_experience || 0,
          hourly_rate_min: talent.hourly_rate_min || undefined,
          hourly_rate_max: talent.hourly_rate_max || undefined,
          salary_expectation_min: talent.salary_expectation_min || undefined,
          salary_expectation_max: talent.salary_expectation_max || undefined,
          availability_status: talent.availability_status || "available",
          portfolio_url: talent.portfolio_url || "",
          resume_url: talent.resume_url || "",
          github_url: talent.github_url || "",
          linkedin_url: talent.linkedin_url || "",
          languages: talent.languages || ["English"],
          timezone: talent.timezone || "UTC",
          work_authorization: talent.work_authorization || "",
          education: talent.education || [],
          certifications: talent.certifications || [],
        });

        // Load existing skills
        try {
          const { data: existingSkills } = await db.getTalentSkills(talent.id);
          if (existingSkills && existingSkills.length > 0) {
            const formattedSkills = existingSkills.map((skill: any) => ({
              skill_id: skill.id,
              skill_name: skill.name,
              proficiency_level: skill.proficiency_level || 3,
              years_of_experience: skill.years_of_experience || 0,
              is_primary: skill.is_primary || false,
            }));
            setSkills(formattedSkills);
          }
        } catch (error) {
          console.error("Error loading skills:", error);
        }

        setInitialLoading(false);
      }
    };

    loadTalentData();
  }, [isOpen, talent]);

  const validateForm = () => {
    const validation = validateTalentProfile(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      processedValue = value ? Number(value) : undefined;
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    setHasUnsavedChanges(true);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLanguageChange = (languages: string[]) => {
    setFormData((prev) => ({ ...prev, languages }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const { data: existingTalent } = await db.getTalent(user.id);

      let result;
      if (existingTalent) {
        result = await db.updateTalent(existingTalent.id, formData);
      } else {
        result = await db.createTalent({
          profile_id: user.id,
          ...formData,
        });
      }

      if (result.error) {
        throw result.error;
      }

      // Save skills - first remove all existing skills, then add new ones
      if (result.data) {
        try {
          // Remove all existing skills for this talent
          await db.removeTalentSkills(result.data.id);

          // Add new skills
          if (skills.length > 0) {
            console.log("💾 Saving skills:", skills);
            for (const skill of skills) {
              try {
                console.log("💾 Saving skill:", {
                  skill_id: skill.skill_id,
                  proficiency_level: skill.proficiency_level,
                  years_of_experience: skill.years_of_experience || 0,
                  is_primary: skill.is_primary || false
                });
                await db.addTalentSkill(
                  result.data.id,
                  skill.skill_id,
                  skill.proficiency_level,
                  skill.years_of_experience || 0,
                  skill.is_primary || false
                );
              } catch (skillError) {
                console.error("Error adding skill:", skillError);
                // Continue with other skills even if one fails
              }
            }
          }
        } catch (skillError) {
          console.error("Error managing skills:", skillError);
          notificationManager.showWarning("Skills updated with some errors");
        }
      }

      // Invalidate all related queries to refresh data everywhere
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['user-data'] }),
        queryClient.invalidateQueries({ queryKey: ['talent'] }),
        queryClient.invalidateQueries({ queryKey: ['talent-skills'] }),
        queryClient.invalidateQueries({ queryKey: ['talent-skills', result.data?.id] }),
        queryClient.invalidateQueries({ queryKey: ['talent-applications'] }),
        queryClient.invalidateQueries({ queryKey: ['talent-matches'] }),
        queryClient.invalidateQueries({ queryKey: ['talent-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['welcome-dashboard'] }),
      ]);
      
      // Force refetch of skills
      await queryClient.refetchQueries({ queryKey: ['talent-skills', result.data?.id] });

      notificationManager.showSuccess("Talent profile updated successfully!");
      setHasUnsavedChanges(false);

      if (onUpdate && result.data) {
        onUpdate(result.data);
      } else {
        // Call onUpdate without data to trigger parent refetch
        onUpdate?.(result.data);
      }

      onClose();
    } catch (error) {
      console.error("Error updating talent profile:", error);
      notificationManager.showError("Failed to update talent profile. Please try again.");
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
        title="Update Talent Profile"
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading talent data...</span>
        </div>
      </ProfileUpdateModal>
    );
  }

  return (
    <ProfileUpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Talent Profile"
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

          <FormField label="Job Title" required error={errors.title}>
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Senior Software Engineer"
              error={!!errors.title}
            />
          </FormField>

          <FormField label="Professional Bio" required error={errors.bio}>
            <Textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your professional background and expertise"
              error={!!errors.bio}
            />
          </FormField>

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

            <FormField
              label="Years of Experience"
              required
              error={errors.years_of_experience}
            >
              <Input
                type="number"
                name="years_of_experience"
                value={formData.years_of_experience || ""}
                onChange={handleInputChange}
                min="0"
                max="50"
                placeholder="e.g., 5"
                error={!!errors.years_of_experience}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Experience Level">
              <Select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleInputChange}
                options={experienceLevels}
              />
            </FormField>

            <FormField label="Availability Status">
              <Select
                name="availability_status"
                value={formData.availability_status}
                onChange={handleInputChange}
                options={availabilityOptions}
              />
            </FormField>
          </div>

          <FormField label="Remote Work Preference">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="remote_preference"
                checked={formData.remote_preference}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Open to remote work</span>
            </label>
          </FormField>
        </div>

        {/* Compensation */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Compensation Expectations
          </h3>

          <FormField
            label="Hourly Rate Range (USD)"
            description="Optional - for contract/freelance work"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                name="hourly_rate_min"
                value={formData.hourly_rate_min || ""}
                onChange={handleInputChange}
                placeholder="Min (e.g., 50)"
              />
              <Input
                type="number"
                name="hourly_rate_max"
                value={formData.hourly_rate_max || ""}
                onChange={handleInputChange}
                placeholder="Max (e.g., 100)"
              />
            </div>
          </FormField>

          <FormField
            label="Annual Salary Expectation (USD)"
            description="Optional - for full-time positions"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                name="salary_expectation_min"
                value={formData.salary_expectation_min || ""}
                onChange={handleInputChange}
                placeholder="Min (e.g., 80000)"
              />
              <Input
                type="number"
                name="salary_expectation_max"
                value={formData.salary_expectation_max || ""}
                onChange={handleInputChange}
                placeholder="Max (e.g., 120000)"
              />
            </div>
          </FormField>
        </div>

        {/* Professional Links */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Professional Links
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Portfolio URL" error={errors.portfolio_url}>
              <Input
                type="url"
                name="portfolio_url"
                value={formData.portfolio_url}
                onChange={handleInputChange}
                placeholder="https://yourportfolio.com"
                error={!!errors.portfolio_url}
              />
            </FormField>

            <FormField label="Resume URL" error={errors.resume_url}>
              <Input
                type="url"
                name="resume_url"
                value={formData.resume_url}
                onChange={handleInputChange}
                placeholder="https://link-to-your-resume.com"
                error={!!errors.resume_url}
              />
            </FormField>

            <FormField label="GitHub URL" error={errors.github_url}>
              <Input
                type="url"
                name="github_url"
                value={formData.github_url}
                onChange={handleInputChange}
                placeholder="https://github.com/yourusername"
                error={!!errors.github_url}
              />
            </FormField>

            <FormField label="LinkedIn URL" error={errors.linkedin_url}>
              <Input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
                error={!!errors.linkedin_url}
              />
            </FormField>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Additional Information
          </h3>

          <FormField label="Languages Spoken">
            <CheckboxGroup
              options={languageOptions}
              selectedValues={formData.languages || []}
              onChange={handleLanguageChange}
              columns={3}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Timezone">
              <Select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                options={timezoneOptions}
              />
            </FormField>

            <FormField label="Work Authorization">
              <Select
                name="work_authorization"
                value={formData.work_authorization}
                onChange={handleInputChange}
                options={workAuthOptions}
                placeholder="Select work authorization"
              />
            </FormField>
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Skills & Expertise
          </h3>
          <SkillsSelector
            selectedSkills={skills}
            onChange={(newSkills) => {
              setSkills(newSkills);
              setHasUnsavedChanges(true);
            }}
          />
        </div>
      </div>
    </ProfileUpdateModal>
  );
}

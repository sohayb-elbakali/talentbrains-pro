import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Briefcase, MapPin, Globe, Linkedin, Github, Link2, DollarSign, Languages } from "lucide-react";
import { notify } from "../../utils/notify";
import { useAuth, useUserData } from "../../hooks/useAuth";
import { db } from "../../lib/supabase/index";
import {
  AvailabilityStatus,
  ExperienceLevel,
  Talent,
  TalentUpdateData,
} from "../../types/database";
import { validateTalentProfile } from "../../utils/profileValidation";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import CheckboxGroup from "../ui/CheckboxGroup";
import ProfileUpdateModal from "../profile/ProfileUpdateModal";
import SkillsSelector from "../skills/SkillsSelector";

interface TalentProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (talent: Talent) => void;
}

// Required field label component
const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <span>{children} <span className="text-red-500">*</span></span>
);

export default function TalentProfileUpdateModal({
  isOpen,
  onClose,
  onUpdate,
}: TalentProfileUpdateModalProps) {
  const { user, profile } = useAuth();
  const { data, refetch } = useUserData(user?.id);
  const queryClient = useQueryClient();
  const talent = data?.talent;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Profile name (stored in profiles table)
  const [fullName, setFullName] = useState("");

  // Talent data (stored in talents table)
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

  const availabilityOptions: Array<{ value: AvailabilityStatus; label: string }> = [
    { value: "available", label: "Available" },
    { value: "open_to_offers", label: "Open to offers" },
    { value: "not_looking", label: "Not looking" },
  ];

  const languageOptions = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Chinese", "Japanese", "Korean", "Arabic", "Russian", "Hindi",
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
    { value: "", label: "Select work authorization" },
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
      if (isOpen) {
        // Load profile name
        setFullName(profile?.full_name || "");

        if (talent) {
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
        }

        setInitialLoading(false);
      }
    };

    loadTalentData();
  }, [isOpen, talent, profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.full_name = "Full name is required";
    }

    const validation = validateTalentProfile(formData);
    Object.assign(newErrors, validation.errors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      // 1. Update profile name first
      const profileResult = await db.updateProfile(user.id, { full_name: fullName.trim() });
      if (profileResult.error) {
        console.error("Profile update error:", profileResult.error);
        // Continue anyway, don't block talent update
      }

      // 2. Update or create talent
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

      // 3. Save skills
      if (result.data) {
        try {
          await db.removeTalentSkills(result.data.id);

          if (skills.length > 0) {
            for (const skill of skills) {
              try {
                await db.addTalentSkill(
                  result.data.id,
                  skill.skill_id,
                  skill.proficiency_level,
                  skill.years_of_experience || 0,
                  skill.is_primary || false
                );
              } catch (skillError) {
                console.error("Error adding skill:", skillError);
              }
            }
          }
        } catch (skillError) {
          console.error("Error managing skills:", skillError);
          notify.showWarning("Skills updated with some errors");
        }
      }

      // 4. Refresh all related queries
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['user-data'] }),
        queryClient.invalidateQueries({ queryKey: ['talent'] }),
        queryClient.invalidateQueries({ queryKey: ['talent-skills'] }),
        queryClient.invalidateQueries({ queryKey: ['welcome-dashboard'] }),
      ]);

      notify.showSuccess("Profile updated successfully!");
      setHasUnsavedChanges(false);

      if (onUpdate && result.data) {
        onUpdate(result.data);
      }

      onClose();
    } catch (error) {
      console.error("Error updating talent profile:", error);
      notify.showError("Failed to update profile. Please try again.");
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading profile data...</span>
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
      <div className="p-6 space-y-8">
        {/* Personal Information */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <User size={18} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
          </div>

          <Input
            label={<RequiredLabel>Full Name</RequiredLabel>}
            name="full_name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setHasUnsavedChanges(true);
              if (errors.full_name) setErrors(prev => ({ ...prev, full_name: "" }));
            }}
            placeholder="Your full name"
            error={errors.full_name}
            leftIcon={<User size={18} className="text-slate-400" />}
          />

          <Input
            label={<RequiredLabel>Job Title</RequiredLabel>}
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Senior Software Engineer"
            error={errors.title}
            leftIcon={<Briefcase size={18} className="text-slate-400" />}
          />

          <Textarea
            label={<RequiredLabel>Professional Bio</RequiredLabel>}
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={3}
            placeholder="Tell us about your professional background and expertise"
            error={errors.bio}
          />
        </div>

        {/* Location & Experience */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Location & Experience</h3>
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
              label={<RequiredLabel>Years of Experience</RequiredLabel>}
              type="number"
              name="years_of_experience"
              value={formData.years_of_experience || ""}
              onChange={handleInputChange}
              min={0}
              max={50}
              placeholder="e.g., 5"
              error={errors.years_of_experience ? String(errors.years_of_experience) : undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Experience Level"
              name="experience_level"
              value={formData.experience_level}
              onChange={handleInputChange}
              options={experienceLevels}
            />

            <Select
              label="Availability Status"
              name="availability_status"
              value={formData.availability_status}
              onChange={handleInputChange}
              options={availabilityOptions}
            />
          </div>

          {/* Remote Toggle */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex-1">
              <p className="font-medium text-slate-900">Open to Remote Work</p>
              <p className="text-sm text-slate-500">Available for remote positions worldwide</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="remote_preference"
                checked={formData.remote_preference}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase size={18} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Skills & Expertise</h3>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <SkillsSelector
              selectedSkills={skills}
              onChange={(newSkills) => {
                setSkills(newSkills);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
        </div>

        {/* Compensation */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Compensation (Optional)</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hourly Rate Range (USD)
            </label>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Annual Salary Expectation (USD)
            </label>
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
          </div>
        </div>

        {/* Professional Links */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center">
              <Link2 size={18} className="text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Professional Links</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Portfolio URL"
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleInputChange}
              placeholder="https://yourportfolio.com"
              error={errors.portfolio_url}
              leftIcon={<Globe size={18} className="text-slate-400" />}
            />

            <Input
              label="Resume URL"
              type="url"
              name="resume_url"
              value={formData.resume_url}
              onChange={handleInputChange}
              placeholder="https://link-to-your-resume.com"
              error={errors.resume_url}
              leftIcon={<Link2 size={18} className="text-slate-400" />}
            />

            <Input
              label="GitHub URL"
              type="url"
              name="github_url"
              value={formData.github_url}
              onChange={handleInputChange}
              placeholder="https://github.com/yourusername"
              error={errors.github_url}
              leftIcon={<Github size={18} className="text-slate-700" />}
            />

            <Input
              label="LinkedIn URL"
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
              error={errors.linkedin_url}
              leftIcon={<Linkedin size={18} className="text-blue-600" />}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
              <Languages size={18} className="text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Languages Spoken</label>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-40 overflow-y-auto">
              <CheckboxGroup
                options={languageOptions}
                selectedValues={formData.languages || []}
                onChange={handleLanguageChange}
                columns={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleInputChange}
              options={timezoneOptions}
            />

            <Select
              label="Work Authorization"
              name="work_authorization"
              value={formData.work_authorization}
              onChange={handleInputChange}
              options={workAuthOptions}
            />
          </div>
        </div>
      </div>
    </ProfileUpdateModal>
  );
}

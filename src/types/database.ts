// Database schema types matching the new database schema

export type UserRole = "talent" | "company" | "admin";
export type ExperienceLevel =
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "executive";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance"
  | "internship";
export type JobStatus = "draft" | "active" | "paused" | "closed" | "expired";
export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type MatchStatus =
  | "pending"
  | "viewed"
  | "interested"
  | "not_interested"
  | "contacted";
export type NotificationType =
  | "match"
  | "application"
  | "message"
  | "system"
  | "reminder";
export type AvailabilityStatus = "available" | "open_to_offers" | "not_looking";

// Core Profile interface
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Company interface matching companies table
export interface Company {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  founded_year?: number;
  culture_values?: string[];
  benefits?: string[];
  social_links: Record<string, string>;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Talent interface matching talents table
export interface Talent {
  id: string;
  profile_id: string;
  title: string;
  bio?: string;
  location?: string;
  remote_preference: boolean;
  experience_level: ExperienceLevel;
  years_of_experience: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  availability_status: AvailabilityStatus;
  portfolio_url?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  languages: string[];
  timezone: string;
  work_authorization?: string;
  education: EducationEntry[];
  certifications: CertificationEntry[];
  created_at: string;
  updated_at: string;
}

// Education entry structure for JSON field
export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

// Certification entry structure for JSON field
export interface CertificationEntry {
  name: string;
  issuer: string;
  year: string;
  url?: string;
  description?: string;
}

// Job interface matching jobs table
export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location?: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  remote_allowed: boolean;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  benefits?: string[];
  requirements?: string;
  application_deadline?: string;
  status: JobStatus;
  views_count: number;
  applications_count: number;
  featured: boolean;
  urgent: boolean;
  created_at: string;
  updated_at: string;
}

// Application interface matching applications table
export interface Application {
  id: string;
  job_id: string;
  talent_id: string;
  status: ApplicationStatus;
  cover_letter?: string;
  custom_resume_url?: string;
  applied_at: string;
  reviewed_at?: string;
  interview_scheduled_at?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

// Skill interface matching skills table
export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Talent skill relationship interface
export interface TalentSkill {
  id: string;
  talent_id: string;
  skill_id: string;
  proficiency_level: number; // 1-5
  years_of_experience: number;
  is_primary: boolean;
  created_at: string;
}

// Form data interfaces for profile updates
export interface CompanyUpdateData {
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  founded_year?: number;
  culture_values?: string[];
  benefits?: string[];
  social_links?: Record<string, string>;
}

export interface TalentUpdateData {
  title: string;
  bio?: string;
  location?: string;
  remote_preference?: boolean;
  experience_level?: ExperienceLevel;
  years_of_experience?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  availability_status?: AvailabilityStatus;
  portfolio_url?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  languages?: string[];
  timezone?: string;
  work_authorization?: string;
  education?: EducationEntry[];
  certifications?: CertificationEntry[];
}

export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

// Job skill relationship interface
export interface JobSkill {
  id: string;
  job_id: string;
  skill_id: string;
  is_required: boolean;
  proficiency_level: number; // 1-5
  created_at: string;
}

// Match interface matching matches table
export interface Match {
  id: string;
  talent_id: string;
  job_id: string;
  match_score?: number; // 0-1
  status: MatchStatus;
  viewed_at?: string;
  interested_at?: string;
  contacted_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Message interface matching messages table
export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// Notification interface matching notifications table
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// Activity log interface matching activity_logs table
export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// System settings interface matching system_settings table
export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Combined profile data for display
export interface FullProfile extends Profile {
  company?: Company;
  talent?: Talent;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Company, "id" | "created_at" | "updated_at">>;
      };
      talents: {
        Row: Talent;
        Insert: Omit<Talent, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Talent, "id" | "created_at" | "updated_at">>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<
          Job,
          | "id"
          | "created_at"
          | "updated_at"
          | "views_count"
          | "applications_count"
        >;
        Update: Partial<Omit<Job, "id" | "created_at" | "updated_at">>;
      };
      applications: {
        Row: Application;
        Insert: Omit<
          Application,
          "id" | "created_at" | "updated_at" | "applied_at"
        >;
        Update: Partial<Omit<Application, "id" | "created_at" | "updated_at">>;
      };
      skills: {
        Row: Skill;
        Insert: Omit<Skill, "id" | "created_at">;
        Update: Partial<Omit<Skill, "id" | "created_at">>;
      };
      talent_skills: {
        Row: TalentSkill;
        Insert: Omit<TalentSkill, "id" | "created_at">;
        Update: Partial<Omit<TalentSkill, "id" | "created_at">>;
      };
      job_skills: {
        Row: JobSkill;
        Insert: Omit<JobSkill, "id" | "created_at">;
        Update: Partial<Omit<JobSkill, "id" | "created_at">>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Match, "id" | "created_at" | "updated_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: Partial<Omit<ActivityLog, "id" | "created_at">>;
      };
      system_settings: {
        Row: SystemSetting;
        Insert: Omit<SystemSetting, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<SystemSetting, "id" | "created_at" | "updated_at">
        >;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      experience_level: ExperienceLevel;
      employment_type: EmploymentType;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      match_status: MatchStatus;
      notification_type: NotificationType;
    };
  };
}

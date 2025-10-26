// Legacy interface for compatibility
export interface Talent {
  id: number;
  name: string;
  title: string;
  location: string;
  rating: number;
  completedProjects: number;
  hourlyRate: string;
  avatar: string;
  skills: string[];
  availability: string;
  matchScore: number;
  experience: string;
  specialization: string;
  bio: string;
}

// New interface for database talent with profile
export interface TalentWithProfile {
  id: string;
  profile_id: string;
  title: string;
  bio?: string;
  location?: string;
  remote_preference: boolean;
  experience_level: 'entry' | 'mid' | 'senior' | 'lead';
  years_of_experience: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  availability_status: string;
  portfolio_url?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  languages: string[];
  timezone: string;
  work_authorization?: string;
  education: any[];
  certifications: any[];
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  };
  talent_skills: Array<{
    skill: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

export interface TalentFilter {
  id: string;
  label: string;
} 

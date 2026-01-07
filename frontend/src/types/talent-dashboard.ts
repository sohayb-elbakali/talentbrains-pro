export interface TalentDashboardData {
  talent: TalentProfile | null;
  matches: JobMatch[];
  applications: JobApplication[];
  analytics: TalentAnalytics;
}

export interface TalentProfile {
  id: string;
  full_name: string;
  title: string;
  location: string;
  skills: string[];
  experience: string;
  hourly_rate: number;
  avatar_url?: string;
}

export interface JobMatch {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    companies?: {
      name: string;
      logo_url?: string;
    };
    salary_min?: number;
    salary_max?: number;
  };
  matchScore: number;
  matchedAt: string;
}

export interface JobApplication {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
    companies?: {
      name: string;
      logo_url?: string;
    };
  };
  status: string;
  appliedAt: string;
}

export interface TalentAnalytics {
  profileViews: number;
  applications: number;
  matches: number;
  messages?: number;
  interviews?: number;
  offers?: number;
  jobViews?: number;
} 

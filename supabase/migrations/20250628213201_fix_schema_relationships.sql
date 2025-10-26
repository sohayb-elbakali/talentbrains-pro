-- Fix database schema relationships
-- This migration fixes the conflicting schema issues

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS talent_skills CASCADE;
DROP TABLE IF EXISTS job_skills CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS talents CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- Recreate tables with correct relationships

-- Skills master table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  website text,
  logo_url text,
  industry text,
  company_size text,
  location text,
  founded_year integer,
  culture_values text[],
  benefits text[],
  social_links jsonb DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Talents table
CREATE TABLE IF NOT EXISTS talents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  bio text,
  location text,
  remote_preference boolean DEFAULT true,
  experience_level experience_level DEFAULT 'mid',
  years_of_experience integer DEFAULT 0,
  hourly_rate_min integer,
  hourly_rate_max integer,
  salary_expectation_min integer,
  salary_expectation_max integer,
  availability_status text DEFAULT 'available',
  portfolio_url text,
  resume_url text,
  github_url text,
  linkedin_url text,
  languages text[] DEFAULT '{"English"}',
  timezone text DEFAULT 'UTC',
  work_authorization text,
  education jsonb DEFAULT '[]',
  certifications jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jobs table (fixed to reference companies.id)
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL,
  requirements text,
  responsibilities text,
  employment_type employment_type DEFAULT 'full_time',
  experience_level experience_level DEFAULT 'mid',
  location text,
  remote_allowed boolean DEFAULT false,
  salary_min integer,
  salary_max integer,
  currency text DEFAULT 'USD',
  benefits text[],
  application_deadline timestamptz,
  status job_status DEFAULT 'draft',
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, slug)
);

-- Applications table (fixed to reference talents.id)
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  cover_letter text,
  custom_resume_url text,
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  interview_scheduled_at timestamptz,
  notes text,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, talent_id)
);

-- Talent skills junction table
CREATE TABLE IF NOT EXISTS talent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level integer CHECK (proficiency_level >= 1 AND proficiency_level <= 5) DEFAULT 3,
  years_of_experience integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, skill_id)
);

-- Job skills junction table
CREATE TABLE IF NOT EXISTS job_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  is_required boolean DEFAULT true,
  proficiency_level integer CHECK (proficiency_level >= 1 AND proficiency_level <= 5) DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_id, skill_id)
);

-- AI Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  match_score decimal(3,2) CHECK (match_score >= 0 AND match_score <= 1),
  status match_status DEFAULT 'pending',
  viewed_at timestamptz,
  interested_at timestamptz,
  contacted_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, job_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_talents_location ON talents(location);
CREATE INDEX IF NOT EXISTS idx_talents_experience_level ON talents(experience_level);
CREATE INDEX IF NOT EXISTS idx_talents_availability ON talents(availability_status);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Companies can manage own data" ON companies
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Public company profiles viewable by talents" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('talent', 'admin')
    )
  );

-- RLS Policies for talents
CREATE POLICY "Talents can manage own data" ON talents
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Public talent profiles viewable by companies" ON talents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('company', 'admin')
    )
  );

-- RLS Policies for skills
CREATE POLICY "Skills are publicly readable" ON skills
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify skills" ON skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for talent_skills
CREATE POLICY "Talents can manage own skills" ON talent_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM talents 
      WHERE id = talent_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Talent skills viewable by companies" ON talent_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('company', 'admin')
    )
  );

-- RLS Policies for jobs
CREATE POLICY "Companies can manage own jobs" ON jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Active jobs viewable by talents" ON jobs
  FOR SELECT USING (
    status = 'active' AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('talent', 'admin')
      )
    )
  );

-- RLS Policies for applications
CREATE POLICY "Talents can manage own applications" ON applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM talents 
      WHERE id = talent_id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view applications for their jobs" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = job_id AND c.profile_id = auth.uid()
    )
  );

-- RLS Policies for matches
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM talents t
      WHERE t.id = talent_id AND t.profile_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = job_id AND c.profile_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_talents_updated_at BEFORE UPDATE ON talents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 

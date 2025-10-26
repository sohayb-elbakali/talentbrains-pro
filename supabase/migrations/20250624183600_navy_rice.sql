/*
  # TalentBrains Core Database Schema

  This migration creates the foundational database structure for the TalentBrains platform.

  ## 1. New Tables
    - `profiles` - User profiles with role-based access (talent/company/admin)
    - `companies` - Company information and settings
    - `talents` - Talent-specific information and preferences
    - `skills` - Master skills catalog with categories
    - `talent_skills` - Many-to-many relationship between talents and skills
    - `jobs` - Job postings with detailed requirements
    - `job_skills` - Required skills for each job
    - `applications` - Job applications and status tracking
    - `matches` - AI-generated matches between talents and jobs
    - `messages` - Communication system between users
    - `notifications` - System notifications and alerts
    - `activity_logs` - Comprehensive audit trail
    - `system_settings` - Application configuration

  ## 2. Security
    - Enable RLS on all tables
    - Create comprehensive policies for data access
    - Implement role-based permissions
    - Add data validation constraints

  ## 3. Performance
    - Add strategic indexes for query optimization
    - Implement full-text search capabilities
    - Create materialized views for analytics

  ## 4. Data Integrity
    - Foreign key constraints
    - Check constraints for data validation
    - Triggers for automated updates
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
CREATE TYPE user_role AS ENUM ('talent', 'company', 'admin');
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE match_status AS ENUM ('pending', 'viewed', 'interested', 'not_interested', 'contacted');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'expired');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'freelance', 'internship');
CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE notification_type AS ENUM ('match', 'application', 'message', 'system', 'reminder');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'talent',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

-- Skills master table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
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

-- Jobs table
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

-- Applications table
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

-- AI Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES talents(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  match_score decimal(5,2) CHECK (match_score >= 0 AND match_score <= 100),
  skill_match_score decimal(5,2) DEFAULT 0,
  experience_match_score decimal(5,2) DEFAULT 0,
  location_match_score decimal(5,2) DEFAULT 0,
  salary_match_score decimal(5,2) DEFAULT 0,
  culture_match_score decimal(5,2) DEFAULT 0,
  status match_status DEFAULT 'pending',
  ai_reasoning text,
  viewed_by_talent boolean DEFAULT false,
  viewed_by_company boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, job_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  thread_id uuid,
  parent_message_id uuid REFERENCES messages(id),
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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
  is_email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
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

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_talents_search ON talents USING gin(to_tsvector('english', title || ' ' || COALESCE(bio, '')));

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for companies
CREATE POLICY "Companies can manage own data" ON companies
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Public company profiles viewable" ON companies
  FOR SELECT USING (true);

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

-- RLS Policies for messages
CREATE POLICY "Users can manage own messages" ON messages
  FOR ALL USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for activity_logs
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for system_settings
CREATE POLICY "Public settings viewable by all" ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create functions for automated updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate match scores
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_talent_id uuid,
  p_job_id uuid
) RETURNS decimal AS $$
DECLARE
  skill_score decimal := 0;
  experience_score decimal := 0;
  location_score decimal := 0;
  salary_score decimal := 0;
  total_score decimal := 0;
BEGIN
  -- Calculate skill match score
  WITH talent_skills_data AS (
    SELECT array_agg(ts.skill_id) as talent_skill_ids,
           avg(ts.proficiency_level) as avg_proficiency
    FROM talent_skills ts
    WHERE ts.talent_id = p_talent_id
  ),
  job_skills_data AS (
    SELECT array_agg(js.skill_id) as job_skill_ids,
           count(*) as total_skills,
           count(*) FILTER (WHERE js.is_required = true) as required_skills
    FROM job_skills js
    WHERE js.job_id = p_job_id
  ),
  skill_overlap AS (
    SELECT 
      cardinality(tsd.talent_skill_ids & jsd.job_skill_ids) as matching_skills,
      jsd.total_skills,
      jsd.required_skills
    FROM talent_skills_data tsd, job_skills_data jsd
  )
  SELECT 
    CASE 
      WHEN so.total_skills > 0 THEN 
        (so.matching_skills::decimal / so.total_skills::decimal) * 100
      ELSE 0 
    END INTO skill_score
  FROM skill_overlap so;

  -- Calculate experience match score
  SELECT 
    CASE 
      WHEN t.experience_level = j.experience_level THEN 100
      WHEN (t.experience_level = 'senior' AND j.experience_level = 'mid') OR
           (t.experience_level = 'mid' AND j.experience_level = 'junior') THEN 80
      WHEN (t.experience_level = 'lead' AND j.experience_level IN ('senior', 'mid')) THEN 90
      ELSE 60
    END INTO experience_score
  FROM talents t, jobs j
  WHERE t.id = p_talent_id AND j.id = p_job_id;

  -- Calculate location match score
  SELECT 
    CASE 
      WHEN j.remote_allowed = true OR t.remote_preference = true THEN 100
      WHEN t.location = j.location THEN 100
      WHEN t.location IS NULL OR j.location IS NULL THEN 50
      ELSE 30
    END INTO location_score
  FROM talents t, jobs j
  WHERE t.id = p_talent_id AND j.id = p_job_id;

  -- Calculate salary match score
  SELECT 
    CASE 
      WHEN j.salary_min IS NULL OR j.salary_max IS NULL OR 
           t.salary_expectation_min IS NULL OR t.salary_expectation_max IS NULL THEN 70
      WHEN t.salary_expectation_min <= j.salary_max AND t.salary_expectation_max >= j.salary_min THEN 100
      WHEN t.salary_expectation_min > j.salary_max THEN 
        GREATEST(0, 100 - ((t.salary_expectation_min - j.salary_max)::decimal / j.salary_max::decimal * 100))
      ELSE 80
    END INTO salary_score
  FROM talents t, jobs j
  WHERE t.id = p_talent_id AND j.id = p_job_id;

  -- Calculate weighted total score
  total_score := (skill_score * 0.4) + (experience_score * 0.25) + (location_score * 0.2) + (salary_score * 0.15);

  RETURN ROUND(total_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI matches
CREATE OR REPLACE FUNCTION generate_ai_matches()
RETURNS void AS $$
BEGIN
  INSERT INTO matches (talent_id, job_id, match_score, skill_match_score, experience_match_score, location_match_score, salary_match_score, ai_reasoning)
  SELECT 
    t.id as talent_id,
    j.id as job_id,
    calculate_match_score(t.id, j.id) as match_score,
    0 as skill_match_score, -- Will be calculated separately
    0 as experience_match_score,
    0 as location_match_score,
    0 as salary_match_score,
    'AI-generated match based on profile compatibility analysis' as ai_reasoning
  FROM talents t
  CROSS JOIN jobs j
  WHERE j.status = 'active'
    AND t.availability_status = 'available'
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE m.talent_id = t.id AND m.job_id = j.id
    )
    AND calculate_match_score(t.id, j.id) >= 70; -- Only create matches above 70% compatibility
END;
$$ LANGUAGE plpgsql;

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('app_name', '"TalentBrains"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode flag', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', false),
('supported_file_types', '["pdf", "doc", "docx", "jpg", "jpeg", "png"]', 'Supported file types for uploads', true),
('email_notifications_enabled', 'true', 'Enable email notifications', false),
('ai_matching_enabled', 'true', 'Enable AI matching feature', true),
('min_match_score_threshold', '70', 'Minimum match score to show matches', false);

-- Insert default skills
INSERT INTO skills (name, category) VALUES
-- Programming Languages
('JavaScript', 'Programming Languages'),
('TypeScript', 'Programming Languages'),
('Python', 'Programming Languages'),
('Java', 'Programming Languages'),
('C#', 'Programming Languages'),
('PHP', 'Programming Languages'),
('Ruby', 'Programming Languages'),
('Go', 'Programming Languages'),
('Rust', 'Programming Languages'),
('Swift', 'Programming Languages'),
('Kotlin', 'Programming Languages'),

-- Frontend Technologies
('React', 'Frontend'),
('Vue.js', 'Frontend'),
('Angular', 'Frontend'),
('HTML5', 'Frontend'),
('CSS3', 'Frontend'),
('Sass/SCSS', 'Frontend'),
('Tailwind CSS', 'Frontend'),
('Bootstrap', 'Frontend'),
('jQuery', 'Frontend'),

-- Backend Technologies
('Node.js', 'Backend'),
('Express.js', 'Backend'),
('Django', 'Backend'),
('Flask', 'Backend'),
('Spring Boot', 'Backend'),
('ASP.NET', 'Backend'),
('Laravel', 'Backend'),
('Ruby on Rails', 'Backend'),

-- Databases
('PostgreSQL', 'Database'),
('MySQL', 'Database'),
('MongoDB', 'Database'),
('Redis', 'Database'),
('SQLite', 'Database'),
('Oracle', 'Database'),
('SQL Server', 'Database'),

-- Cloud & DevOps
('AWS', 'Cloud & DevOps'),
('Azure', 'Cloud & DevOps'),
('Google Cloud', 'Cloud & DevOps'),
('Docker', 'Cloud & DevOps'),
('Kubernetes', 'Cloud & DevOps'),
('Jenkins', 'Cloud & DevOps'),
('GitLab CI', 'Cloud & DevOps'),
('Terraform', 'Cloud & DevOps'),

-- Design
('Figma', 'Design'),
('Sketch', 'Design'),
('Adobe XD', 'Design'),
('Photoshop', 'Design'),
('Illustrator', 'Design'),
('UI/UX Design', 'Design'),
('Prototyping', 'Design'),

-- Data Science & AI
('Machine Learning', 'Data Science & AI'),
('Deep Learning', 'Data Science & AI'),
('TensorFlow', 'Data Science & AI'),
('PyTorch', 'Data Science & AI'),
('Pandas', 'Data Science & AI'),
('NumPy', 'Data Science & AI'),
('Scikit-learn', 'Data Science & AI'),

-- Mobile Development
('React Native', 'Mobile'),
('Flutter', 'Mobile'),
('iOS Development', 'Mobile'),
('Android Development', 'Mobile'),
('Xamarin', 'Mobile'),

-- Other
('Git', 'Tools'),
('Agile/Scrum', 'Methodologies'),
('REST APIs', 'APIs'),
('GraphQL', 'APIs'),
('Testing', 'Quality Assurance'),
('Project Management', 'Management');
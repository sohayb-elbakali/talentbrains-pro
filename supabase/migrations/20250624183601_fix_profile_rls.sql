-- Fix missing RLS policy for profile creation
-- This migration adds the missing INSERT policy for the profiles table

-- Add INSERT policy for profiles
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add INSERT policy for companies (if user is a company)
CREATE POLICY "Companies can create own company profile" ON companies
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Add INSERT policy for talents (if user is a talent)
CREATE POLICY "Talents can create own talent profile" ON talents
  FOR INSERT WITH CHECK (profile_id = auth.uid()); 

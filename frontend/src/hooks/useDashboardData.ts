import { useQuery } from '@tanstack/react-query';
import { db } from '../lib/supabase/index';
import { useDataStore, useCachedJobs, useCachedApplications } from '../stores/dataStore';
import { useEffect } from 'react';

/**
 * Optimized hook for loading dashboard data with proper caching
 * 
 * Features:
 * - Uses Zustand store for instant placeholder data
 * - Updates store when fresh data arrives
 * - Long staleTime to reduce API calls
 * - Persisted across sessions via React Query persister
 */
export function useTalentDashboardData(userId: string | undefined, talentId: string | undefined) {
  const { setApplications, setJobs } = useDataStore();
  const { applications: cachedApplications } = useCachedApplications();
  const { jobs: cachedJobs } = useCachedJobs();

  // Applications query with placeholder data
  const applicationsQuery = useQuery({
    queryKey: ['talent-applications', talentId],
    queryFn: async () => {
      if (!talentId) return [];
      const { data, error } = await db.getApplications({ talent_id: talentId });
      if (error) throw error;
      return (data || []).slice(0, 4);
    },
    enabled: !!talentId,
    staleTime: 30 * 60 * 1000, // 30 minutes - data stays fresh longer
    gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep cached longer
    refetchOnWindowFocus: false,
    placeholderData: cachedApplications.slice(0, 4),
  });

  // AI Matches query - fetches from matching API
  const matchesQuery = useQuery({
    queryKey: ['talent-ai-matches', talentId],
    queryFn: async () => {
      if (!talentId) return [];

      // Try to fetch from the AI matching API first
      try {
        const matchResponse = await fetch(`http://localhost:8000/api/v1/matching/talent/${talentId}/jobs?limit=10`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (matchResponse.ok) {
          const matchingResults = await matchResponse.json();

          // Get all jobs to enrich match data
          const { data: allJobs } = await db.getJobs({});
          const jobsMap = new Map((allJobs || []).map((j: any) => [j.id, j]));

          // Map and enrich match results with job data
          return matchingResults.map((m: any) => {
            const jobData: any = jobsMap.get(m.job_id) || {};
            return {
              id: `match-${m.job_id}`,
              job_id: m.job_id,
              match_score: m.match_score || 0,
              matchScore: m.match_score || 0,
              skill_match_score: m.skill_match_score || 0,
              experience_match_score: m.experience_match_score || 0,
              location_match_score: m.location_match_score || 0,
              matched_skills: m.matched_skills || [],
              job: {
                id: m.job_id,
                title: jobData.title || m.job_title || 'Position',
                location: jobData.location || m.location,
                employment_type: jobData.employment_type,
                salary_min: jobData.salary_min,
                salary_max: jobData.salary_max,
                companies: jobData.companies || { name: m.company || 'Company' },
              },
            };
          }).sort((a: any, b: any) => b.matchScore - a.matchScore);
        }
      } catch (err) {
        console.log('AI matching API not available, falling back to DB matches');
      }

      // Fallback to database matches if API fails
      const { data, error } = await db.getMatches({ talent_id: talentId });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        matchScore: m.match_score || 0,
      }));
    },
    enabled: !!talentId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
  });

  // Analytics query
  const analyticsQuery = useQuery({
    queryKey: ['talent-analytics', userId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await db.getAnalytics(userId, 'talent');
      if (result && !result.error) {
        const analyticsData = 'data' in result ? result.data : result;
        return {
          profileViews: analyticsData.profileViews || 0,
          applications: analyticsData.applications || 0,
          matches: analyticsData.matches || 0,
          messages: analyticsData.messages || 0,
        };
      }
      return null;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
  });

  // Jobs query with placeholder data
  const jobsQuery = useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const { data, error } = await db.getJobs({});
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    placeholderData: cachedJobs,
  });

  // Sync to Zustand store when data updates
  useEffect(() => {
    if (applicationsQuery.data && applicationsQuery.data.length > 0) {
      setApplications(applicationsQuery.data as any);
    }
  }, [applicationsQuery.data, setApplications]);

  useEffect(() => {
    if (jobsQuery.data && jobsQuery.data.length > 0) {
      setJobs(jobsQuery.data as any);
    }
  }, [jobsQuery.data, setJobs]);

  return {
    applications: applicationsQuery.data || cachedApplications.slice(0, 4) || [],
    matches: matchesQuery.data || [],
    analytics: analyticsQuery.data || {
      profileViews: 0,
      applications: 0,
      matches: 0,
      messages: 0,
    },
    jobs: jobsQuery.data || cachedJobs || [],
    isLoading:
      applicationsQuery.isLoading ||
      matchesQuery.isLoading ||
      analyticsQuery.isLoading ||
      jobsQuery.isLoading,
    // Don't show loading if we have placeholder data
    isInitialLoading:
      (applicationsQuery.isLoading && !applicationsQuery.data && cachedApplications.length === 0) ||
      (jobsQuery.isLoading && !jobsQuery.data && cachedJobs.length === 0),
    error:
      applicationsQuery.error ||
      matchesQuery.error ||
      analyticsQuery.error ||
      jobsQuery.error,
  };
}


/**
 * Optimized hook for company dashboard data
 * Uses longer cache times and syncs to Zustand store
 */
export function useCompanyDashboardData(companyId: string | undefined) {
  const { setJobs, setApplications } = useDataStore();
  const { jobs: cachedJobs } = useCachedJobs();

  // Jobs query with placeholder data
  const jobsQuery = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getJobs({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    placeholderData: cachedJobs.filter(j => j.company_id === companyId),
  });

  // Applications query
  const applicationsQuery = useQuery({
    queryKey: ['company-applications', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getApplications({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
  });

  // Sync to Zustand store
  useEffect(() => {
    if (jobsQuery.data && jobsQuery.data.length > 0) {
      setJobs(jobsQuery.data as any);
    }
  }, [jobsQuery.data, setJobs]);

  useEffect(() => {
    if (applicationsQuery.data && applicationsQuery.data.length > 0) {
      setApplications(applicationsQuery.data as any);
    }
  }, [applicationsQuery.data, setApplications]);

  const activeJobs = jobsQuery.data?.filter((job: any) => job.status === 'active') || [];
  const recentJobs = activeJobs.slice(0, 5);

  return {
    jobs: jobsQuery.data || [],
    activeJobs: activeJobs.length,
    recentJobs,
    applications: applicationsQuery.data || [],
    totalApplicants: applicationsQuery.data?.length || 0,
    isLoading: jobsQuery.isLoading || applicationsQuery.isLoading,
    isInitialLoading: jobsQuery.isLoading && !jobsQuery.data && cachedJobs.length === 0,
    error: jobsQuery.error || applicationsQuery.error,
  };
}

/**
 * Optimized hook for admin dashboard data
 * Admin stats can have longer cache since they're less time-sensitive
 */
export function useAdminDashboardData() {
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const results = await Promise.allSettled([
        db.supabase.from("profiles").select("id"),
        db.supabase.from("companies").select("id"),
        db.supabase.from("jobs").select("id"),
        db.supabase.from("applications").select("id"),
        db.supabase.from("matches").select("id"),
      ]);

      const totalUsers = results[0].status === "fulfilled" ? results[0].value.data?.length || 0 : 0;
      const totalCompanies = results[1].status === "fulfilled" ? results[1].value.data?.length || 0 : 0;
      const totalJobs = results[2].status === "fulfilled" ? results[2].value.data?.length || 0 : 0;
      const totalApplications = results[3].status === "fulfilled" ? results[3].value.data?.length || 0 : 0;
      const activeMatches = results[4].status === "fulfilled" ? results[4].value.data?.length || 0 : 0;

      let systemHealth = 85;
      if (totalUsers > 0) systemHealth += 5;
      if (totalCompanies > 0) systemHealth += 3;
      if (totalJobs > 0) systemHealth += 3;
      if (totalApplications > 0) systemHealth += 2;
      if (activeMatches > 0) systemHealth += 2;
      systemHealth = Math.min(systemHealth, 100);

      return {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        activeMatches,
        systemHealth,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - admin stats don't need to be super fresh
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await db.supabase
        .from("profiles")
        .select("id, email, full_name, role, is_active, is_verified, created_at, last_login_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    stats: statsQuery.data,
    users: usersQuery.data || [],
    isLoading: statsQuery.isLoading || usersQuery.isLoading,
    error: statsQuery.error || usersQuery.error,
  };
}

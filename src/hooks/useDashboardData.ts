import { useQuery } from '@tanstack/react-query';
import { db } from '../lib/supabase';

/**
 * Optimized hook for loading dashboard data with proper caching
 * This prevents unnecessary refetches and improves performance
 */
export function useTalentDashboardData(userId: string | undefined, talentId: string | undefined) {
  // Applications query
  const applicationsQuery = useQuery({
    queryKey: ['talent-applications', talentId],
    queryFn: async () => {
      if (!talentId) return [];
      const { data, error } = await db.getApplications({ talent_id: talentId });
      if (error) throw error;
      return (data || []).slice(0, 4); // Only get 4 most recent
    },
    enabled: !!talentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Matches query
  const matchesQuery = useQuery({
    queryKey: ['talent-matches', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await db.getMatches({ talent_id: userId });
      if (error) throw error;
      return (data || []).slice(0, 5); // Only get 5 top matches
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000, // 10 minutes - analytics don't change often
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Jobs query
  const jobsQuery = useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      const { data, error } = await db.getJobs({});
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    applications: applicationsQuery.data || [],
    matches: matchesQuery.data || [],
    analytics: analyticsQuery.data || {
      profileViews: 0,
      applications: 0,
      matches: 0,
      messages: 0,
    },
    jobs: jobsQuery.data || [],
    isLoading:
      applicationsQuery.isLoading ||
      matchesQuery.isLoading ||
      analyticsQuery.isLoading ||
      jobsQuery.isLoading,
    error:
      applicationsQuery.error ||
      matchesQuery.error ||
      analyticsQuery.error ||
      jobsQuery.error,
  };
}

/**
 * Optimized hook for company dashboard data
 */
export function useCompanyDashboardData(companyId: string | undefined) {
  // Jobs query
  const jobsQuery = useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await db.getJobs({ company_id: companyId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const activeJobs = jobsQuery.data?.filter((job: any) => job.status === 'active') || [];
  const recentJobs = activeJobs.slice(0, 5);

  return {
    jobs: jobsQuery.data || [],
    activeJobs: activeJobs.length,
    recentJobs,
    applications: applicationsQuery.data || [],
    totalApplicants: applicationsQuery.data?.length || 0,
    isLoading: jobsQuery.isLoading || applicationsQuery.isLoading,
    error: jobsQuery.error || applicationsQuery.error,
  };
}

/**
 * Optimized hook for admin dashboard data
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    stats: statsQuery.data,
    users: usersQuery.data || [],
    isLoading: statsQuery.isLoading || usersQuery.isLoading,
    error: statsQuery.error || usersQuery.error,
  };
}

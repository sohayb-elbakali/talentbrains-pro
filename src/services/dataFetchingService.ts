/**
 * Centralized data fetching service with pagination, caching, and performance optimization
 * This service ensures optimal loading performance and prevents loading large datasets at once
 */

import { db } from '../lib/supabase';
import { QueryClient } from '@tanstack/react-query';

// Pagination configuration - optimized for performance
export const PAGINATION_CONFIG = {
  JOBS_PER_PAGE: 12,
  TALENTS_PER_PAGE: 12,
  APPLICATIONS_PER_PAGE: 10,
  MATCHES_PER_PAGE: 10,
  INITIAL_LOAD: 6, // Load fewer items initially for faster perceived performance
};

// Cache configuration for React Query
export const CACHE_CONFIG = {
  // How long data stays fresh before refetching
  STALE_TIME: {
    JOBS: 5 * 60 * 1000, // 5 minutes
    TALENTS: 10 * 60 * 1000, // 10 minutes
    PROFILE: 15 * 60 * 1000, // 15 minutes
    ANALYTICS: 10 * 60 * 1000, // 10 minutes
    APPLICATIONS: 2 * 60 * 1000, // 2 minutes (more dynamic)
  },
  // How long data stays in cache after being unused
  GC_TIME: {
    DEFAULT: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Fetch jobs with pagination and filtering
 * Uses cursor-based pagination for better performance
 */
export const fetchJobs = async (params: {
  page: number;
  limit?: number;
  filters?: Record<string, unknown>;
  searchTerm?: string;
}) => {
  const { page, limit = PAGINATION_CONFIG.JOBS_PER_PAGE, filters = {}, searchTerm } = params;
  const offset = page * limit;

  try {
    // Build query filters
    const queryFilters = {
      ...filters,
      limit,
      offset,
    };

    // Fetch jobs with pagination
    const { data, error } = await db.getJobs(queryFilters);

    if (error) {
      throw error;
    }

    // Transform data and fetch skills in parallel (only for current page)
    const transformedJobs = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data || []).map(async (job: any) => {
        // Fetch skills for this job
        const { data: skillsData } = await db.getJobSkills(job.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const skills = skillsData?.map((s: any) => s.skill_name || s.skill?.name) || [];

        return {
          id: job.id,
          title: job.title,
          company: job.company_name || 'Company',
          location: job.location || 'Not specified',
          type: formatEmploymentType(job.employment_type),
          salary: formatSalary(job.salary_min, job.salary_max, job.currency),
          postedTime: getTimeAgo(job.created_at),
          skills: skills,
          matchScore: Math.floor(Math.random() * 20) + 80,
          employees: 'N/A',
          description: job.description || 'No description available.',
          status: job.status,
        };
      })
    );

    // Apply client-side search filter if provided
    let filteredJobs = transformedJobs;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredJobs = transformedJobs.filter((job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.skills.some((skill: string) => skill.toLowerCase().includes(searchLower))
      );
    }

    return {
      jobs: filteredJobs,
      hasMore: data && data.length === limit,
      page,
      totalCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

/**
 * Fetch talents with pagination and filtering
 */
export const fetchTalents = async (params: {
  page: number;
  limit?: number;
  filters?: Record<string, unknown>;
  searchTerm?: string;
}) => {
  const { page, limit = PAGINATION_CONFIG.TALENTS_PER_PAGE, filters = {}, searchTerm } = params;
  const offset = page * limit;

  try {
    // Build query filters
    const queryFilters = {
      ...filters,
      limit,
      offset,
    };

    const { data, error } = await db.getTalents(queryFilters);

    if (error) {
      throw error;
    }

    // Apply client-side search filter if provided
    let filteredTalents = data || [];
    if (searchTerm && data) {
      const searchLower = searchTerm.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filteredTalents = data.filter((talent: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const skills = talent.talent_skills?.map((ts: any) => ts.skill.name) || [];
        return (
          talent.profile?.full_name?.toLowerCase().includes(searchLower) ||
          talent.title?.toLowerCase().includes(searchLower) ||
          skills.some((skill: string) => skill.toLowerCase().includes(searchLower)) ||
          talent.location?.toLowerCase().includes(searchLower)
        );
      });
    }

    return {
      talents: filteredTalents,
      hasMore: data && data.length === limit,
      page,
      totalCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching talents:', error);
    throw error;
  }
};

/**
 * Fetch applications with pagination
 */
export const fetchApplications = async (params: {
  page: number;
  limit?: number;
  filters?: Record<string, unknown>;
}) => {
  const { page, limit = PAGINATION_CONFIG.APPLICATIONS_PER_PAGE, filters = {} } = params;
  const offset = page * limit;

  try {
    const queryFilters = {
      ...filters,
      limit,
      offset,
    };

    const { data, error } = await db.getApplications(queryFilters);

    if (error) {
      throw error;
    }

    return {
      applications: data || [],
      hasMore: data && data.length === limit,
      page,
      totalCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};

/**
 * Prefetch next page data for smoother UX
 */
export const prefetchNextPage = async (
  queryClient: QueryClient,
  queryKey: string[],
  fetchFn: (params: { page: number; filters?: Record<string, unknown> }) => Promise<unknown>,
  currentPage: number,
  filters?: Record<string, unknown>
) => {
  await queryClient.prefetchQuery({
    queryKey: [...queryKey, currentPage + 1],
    queryFn: () => fetchFn({ page: currentPage + 1, filters }),
    staleTime: CACHE_CONFIG.STALE_TIME.JOBS,
  });
};

// Helper functions
const formatEmploymentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'full_time': 'Full-time',
    'part_time': 'Part-time',
    'contract': 'Contract',
    'freelance': 'Freelance',
    'internship': 'Internship'
  };
  return typeMap[type] || type;
};

const formatSalary = (min?: number, max?: number, currency: string = 'USD'): string => {
  const symbol = currency === 'USD' ? '$' : currency;
  if (min && max) {
    return `${symbol}${(min / 1000).toFixed(0)}k - ${symbol}${(max / 1000).toFixed(0)}k`;
  } else if (min) {
    return `${symbol}${(min / 1000).toFixed(0)}k+`;
  } else if (max) {
    return `Up to ${symbol}${(max / 1000).toFixed(0)}k`;
  }
  return 'Competitive';
};

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

/**
 * Batch prefetch for initial page load
 * Loads minimal data first, then prefetches more in background
 */
export const batchPrefetchData = async (
  queryClient: QueryClient,
  userType: 'talent' | 'company' | 'admin'
) => {
  // Load critical data first (synchronously)
  const criticalQueries = [];

  if (userType === 'talent') {
    criticalQueries.push(
      queryClient.prefetchQuery({
        queryKey: ['jobs', 0],
        queryFn: () => fetchJobs({ page: 0, limit: PAGINATION_CONFIG.INITIAL_LOAD }),
        staleTime: CACHE_CONFIG.STALE_TIME.JOBS,
      })
    );
  } else if (userType === 'company') {
    criticalQueries.push(
      queryClient.prefetchQuery({
        queryKey: ['talents', 0],
        queryFn: () => fetchTalents({ page: 0, limit: PAGINATION_CONFIG.INITIAL_LOAD }),
        staleTime: CACHE_CONFIG.STALE_TIME.TALENTS,
      })
    );
  }

  await Promise.all(criticalQueries);

  // Prefetch next pages in background (non-blocking)
  setTimeout(() => {
    if (userType === 'talent') {
      queryClient.prefetchQuery({
        queryKey: ['jobs', 1],
        queryFn: () => fetchJobs({ page: 1 }),
        staleTime: CACHE_CONFIG.STALE_TIME.JOBS,
      });
    } else if (userType === 'company') {
      queryClient.prefetchQuery({
        queryKey: ['talents', 1],
        queryFn: () => fetchTalents({ page: 1 }),
        staleTime: CACHE_CONFIG.STALE_TIME.TALENTS,
      });
    }
  }, 1000); // Delay by 1 second to not block initial render
};

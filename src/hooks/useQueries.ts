import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { db } from '../lib/supabase/index';

// Query key factory for consistent key generation
export const queryKeys = {
    // Jobs
    jobs: {
        all: ['jobs'] as const,
        list: (filters?: any) => ['jobs', 'list', filters] as const,
        detail: (id: string) => ['jobs', 'detail', id] as const,
        skills: (id: string) => ['jobs', 'skills', id] as const,
    },
    // Talents
    talents: {
        all: ['talents'] as const,
        list: (filters?: any) => ['talents', 'list', filters] as const,
        detail: (id: string) => ['talents', 'detail', id] as const,
        skills: (id: string) => ['talents', 'skills', id] as const,
    },
    // Companies
    companies: {
        all: ['companies'] as const,
        detail: (id: string) => ['companies', 'detail', id] as const,
        jobs: (id: string) => ['companies', 'jobs', id] as const,
    },
    // Applications
    applications: {
        all: ['applications'] as const,
        list: (filters?: any) => ['applications', 'list', filters] as const,
        detail: (id: string) => ['applications', 'detail', id] as const,
        forJob: (jobId: string) => ['applications', 'job', jobId] as const,
        forTalent: (talentId: string) => ['applications', 'talent', talentId] as const,
    },
    // User data
    user: {
        data: (userId: string) => ['user-data', userId] as const,
        profile: (userId: string) => ['user-profile', userId] as const,
    },
    // Dashboard
    dashboard: {
        company: (companyId: string) => ['dashboard', 'company', companyId] as const,
        talent: (talentId: string) => ['dashboard', 'talent', talentId] as const,
        admin: () => ['dashboard', 'admin'] as const,
    },
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;

export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

export function getPaginationRange(params: PaginationParams) {
    const page = params.page || 1;
    const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;
    return { offset, limit: pageSize };
}

// ============================================
// Jobs Hooks
// ============================================

interface UseJobsOptions {
    filters?: any;
    pagination?: PaginationParams;
    enabled?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
    const { filters, pagination, enabled = true } = options;
    const { offset, limit } = getPaginationRange(pagination || {});

    return useQuery({
        queryKey: queryKeys.jobs.list({ ...filters, offset, limit }),
        queryFn: async () => {
            const result = await db.getJobs({ ...filters, limit, offset });
            if (result.error) throw result.error;
            return result.data;
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useJob(jobId: string, options?: Partial<UseQueryOptions>) {
    return useQuery({
        queryKey: queryKeys.jobs.detail(jobId),
        queryFn: async () => {
            const result = await db.getJob(jobId);
            if (result.error) throw result.error;
            return result.data;
        },
        enabled: !!jobId,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useJobSkills(jobId: string) {
    return useQuery({
        queryKey: queryKeys.jobs.skills(jobId),
        queryFn: async () => {
            const result = await db.getJobSkills(jobId);
            if (result.error) throw result.error;
            return result.data;
        },
        enabled: !!jobId,
        staleTime: 10 * 60 * 1000,
    });
}

// ============================================
// Talents Hooks
// ============================================

interface UseTalentsOptions {
    filters?: any;
    pagination?: PaginationParams;
    enabled?: boolean;
}

export function useTalents(options: UseTalentsOptions = {}) {
    const { filters, pagination, enabled = true } = options;
    const { offset, limit } = getPaginationRange(pagination || {});

    return useQuery({
        queryKey: queryKeys.talents.list({ ...filters, offset, limit }),
        queryFn: async () => {
            const result = await db.getTalents({ ...filters, limit, offset });
            if (result.error) throw result.error;
            return result.data;
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useTalent(profileId: string) {
    return useQuery({
        queryKey: queryKeys.talents.detail(profileId),
        queryFn: async () => {
            const result = await db.getTalent(profileId);
            if (result.error) throw result.error;
            return result.data;
        },
        enabled: !!profileId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useTalentSkills(talentId: string) {
    return useQuery({
        queryKey: queryKeys.talents.skills(talentId),
        queryFn: async () => {
            const result = await db.getTalentSkills(talentId);
            if (result.error) throw result.error;
            return result.data;
        },
        enabled: !!talentId,
        staleTime: 10 * 60 * 1000,
    });
}

// ============================================
// Prefetch Utilities
// ============================================

export function usePrefetch() {
    const queryClient = useQueryClient();

    return {
        prefetchJob: (jobId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.jobs.detail(jobId),
                queryFn: async () => {
                    const result = await db.getJob(jobId);
                    if (result.error) throw result.error;
                    return result.data;
                },
                staleTime: 5 * 60 * 1000,
            });
        },

        prefetchJobSkills: (jobId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.jobs.skills(jobId),
                queryFn: async () => {
                    const result = await db.getJobSkills(jobId);
                    if (result.error) throw result.error;
                    return result.data;
                },
                staleTime: 10 * 60 * 1000,
            });
        },

        prefetchTalent: (profileId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.talents.detail(profileId),
                queryFn: async () => {
                    const result = await db.getTalent(profileId);
                    if (result.error) throw result.error;
                    return result.data;
                },
                staleTime: 5 * 60 * 1000,
            });
        },

        prefetchNextPage: (currentPage: number, queryKey: readonly unknown[], fetchFn: () => Promise<any>) => {
            queryClient.prefetchQuery({
                queryKey: [...queryKey, currentPage + 1],
                queryFn: fetchFn,
                staleTime: 5 * 60 * 1000,
            });
        },
    };
}

// Hook for prefetching on hover
export function usePrefetchOnHover(prefetchFn: () => void) {
    return {
        onMouseEnter: prefetchFn,
        onFocus: prefetchFn,
    };
}

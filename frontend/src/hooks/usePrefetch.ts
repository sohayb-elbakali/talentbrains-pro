import { useCallback } from 'react';
import { queryClient, prefetchQuery } from '../lib/queryClient';
import { db } from '../lib/supabase/index';

/**
 * Hook for prefetching data on hover/navigation intent
 * 
 * This reduces perceived loading time by fetching data before the user
 * actually navigates to a page.
 */
export function usePrefetch() {
    /**
     * Prefetch job details when hovering over a job card
     */
    const prefetchJobDetails = useCallback(async (jobId: string) => {
        await prefetchQuery(
            ['job-details', jobId],
            async () => {
                const { data, error } = await db.getJob(jobId);
                if (error) throw error;
                return data;
            },
            10 * 60 * 1000 // 10 minutes stale time
        );
    }, []);

    /**
     * Prefetch company jobs when navigating to company dashboard
     */
    const prefetchCompanyJobs = useCallback(async (companyId: string) => {
        await prefetchQuery(
            ['company-jobs', companyId],
            async () => {
                const { data, error } = await db.getJobs({ company_id: companyId });
                if (error) throw error;
                return data || [];
            },
            10 * 60 * 1000
        );
    }, []);

    /**
     * Prefetch all active jobs for job browsing
     */
    const prefetchAllJobs = useCallback(async () => {
        await prefetchQuery(
            ['all-jobs'],
            async () => {
                const { data, error } = await db.getJobs({});
                if (error) throw error;
                return data || [];
            },
            15 * 60 * 1000
        );
    }, []);

    /**
     * Prefetch talent profile for viewing
     */
    const prefetchTalentProfile = useCallback(async (talentId: string) => {
        await prefetchQuery(
            ['talent-profile', talentId],
            async () => {
                const { data, error } = await db.getTalent(talentId);
                if (error) throw error;
                return data;
            },
            15 * 60 * 1000
        );
    }, []);

    /**
     * Prefetch applications for a specific job
     */
    const prefetchJobApplications = useCallback(async (jobId: string) => {
        await prefetchQuery(
            ['job-applications', jobId],
            async () => {
                const { data, error } = await db.getApplications({ job_id: jobId });
                if (error) throw error;
                return data || [];
            },
            5 * 60 * 1000
        );
    }, []);

    /**
     * Prefetch dashboard data based on user role
     */
    const prefetchDashboard = useCallback(async (role: 'talent' | 'company' | 'admin', userId: string) => {
        if (role === 'talent') {
            await Promise.all([
                prefetchAllJobs(),
                prefetchQuery(
                    ['talent-applications', userId],
                    async () => {
                        const { data, error } = await db.getApplications({ talent_id: userId });
                        if (error) throw error;
                        return (data || []).slice(0, 4);
                    },
                    10 * 60 * 1000
                ),
            ]);
        } else if (role === 'company') {
            const { data: companyData } = await db.getCompany(userId);
            if (companyData?.id) {
                await prefetchCompanyJobs(companyData.id);
            }
        }
    }, [prefetchAllJobs, prefetchCompanyJobs]);

    /**
     * Check if data is already cached
     */
    const isCached = useCallback((queryKey: unknown[]) => {
        const data = queryClient.getQueryData(queryKey);
        return data !== undefined;
    }, []);

    /**
     * Get cached data if available
     */
    const getCached = useCallback(<T>(queryKey: unknown[]): T | undefined => {
        return queryClient.getQueryData<T>(queryKey);
    }, []);

    return {
        prefetchJobDetails,
        prefetchCompanyJobs,
        prefetchAllJobs,
        prefetchTalentProfile,
        prefetchJobApplications,
        prefetchDashboard,
        isCached,
        getCached,
    };
}

/**
 * Hook for data prefetching on mouse enter events
 * Use with onMouseEnter on navigation elements
 */
export function useHoverPrefetch() {
    const { prefetchJobDetails, prefetchTalentProfile, prefetchAllJobs } = usePrefetch();

    const onJobCardHover = useCallback((jobId: string) => {
        // Use requestIdleCallback if available for non-blocking prefetch
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => prefetchJobDetails(jobId));
        } else {
            setTimeout(() => prefetchJobDetails(jobId), 100);
        }
    }, [prefetchJobDetails]);

    const onTalentCardHover = useCallback((talentId: string) => {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => prefetchTalentProfile(talentId));
        } else {
            setTimeout(() => prefetchTalentProfile(talentId), 100);
        }
    }, [prefetchTalentProfile]);

    const onJobsLinkHover = useCallback(() => {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => prefetchAllJobs());
        } else {
            setTimeout(() => prefetchAllJobs(), 100);
        }
    }, [prefetchAllJobs]);

    return {
        onJobCardHover,
        onTalentCardHover,
        onJobsLinkHover,
    };
}

export default usePrefetch;

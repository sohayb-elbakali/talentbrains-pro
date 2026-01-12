import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Centralized Data Store
 * 
 * Provides a secondary layer of caching with localStorage persistence.
 * This acts as a fallback when React Query cache is empty (e.g., cold start).
 * 
 * Benefits:
 * - Instant data on app load (before React Query hydrates)
 * - Fallback data when offline
 * - Reduced API calls by providing placeholder data
 */

interface Job {
    id: string;
    title: string;
    company_id: string;
    status: string;
    location?: string;
    employment_type?: string;
    [key: string]: unknown;
}

interface Application {
    id: string;
    job_id: string;
    talent_id: string;
    status: string;
    applied_at: string;
    [key: string]: unknown;
}

interface DataState {
    // Cached jobs list
    jobs: Job[];
    jobsLastUpdated: number | null;

    // Cached applications
    applications: Application[];
    applicationsLastUpdated: number | null;

    // Sync status
    isStale: boolean;
    lastSyncAttempt: number | null;

    // Actions
    setJobs: (jobs: Job[]) => void;
    setApplications: (applications: Application[]) => void;
    markStale: () => void;
    markFresh: () => void;
    clearData: () => void;

    // Helpers
    getJob: (id: string) => Job | undefined;
    getJobsByCompany: (companyId: string) => Job[];
    getApplicationsByTalent: (talentId: string) => Application[];
    getApplicationsByJob: (jobId: string) => Application[];
}

// Cache expiry time (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

export const useDataStore = create<DataState>()(
    persist(
        (set, get) => ({
            // Initial state
            jobs: [],
            jobsLastUpdated: null,
            applications: [],
            applicationsLastUpdated: null,
            isStale: true,
            lastSyncAttempt: null,

            // Actions
            setJobs: (jobs) => set({
                jobs,
                jobsLastUpdated: Date.now(),
                isStale: false,
            }),

            setApplications: (applications) => set({
                applications,
                applicationsLastUpdated: Date.now(),
                isStale: false,
            }),

            markStale: () => set({ isStale: true }),

            markFresh: () => set({
                isStale: false,
                lastSyncAttempt: Date.now(),
            }),

            clearData: () => set({
                jobs: [],
                jobsLastUpdated: null,
                applications: [],
                applicationsLastUpdated: null,
                isStale: true,
                lastSyncAttempt: null,
            }),

            // Helpers
            getJob: (id) => get().jobs.find(job => job.id === id),

            getJobsByCompany: (companyId) =>
                get().jobs.filter(job => job.company_id === companyId),

            getApplicationsByTalent: (talentId) =>
                get().applications.filter(app => app.talent_id === talentId),

            getApplicationsByJob: (jobId) =>
                get().applications.filter(app => app.job_id === jobId),
        }),
        {
            name: 'data-cache',
            // Only persist essential data
            partialize: (state) => ({
                jobs: state.jobs,
                jobsLastUpdated: state.jobsLastUpdated,
                applications: state.applications,
                applicationsLastUpdated: state.applicationsLastUpdated,
            }),
        }
    )
);

/**
 * Check if cached data is still valid
 */
export function isCacheValid(lastUpdated: number | null): boolean {
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < CACHE_EXPIRY;
}

/**
 * Hook to get cached jobs with validity check
 */
export function useCachedJobs() {
    const { jobs, jobsLastUpdated, isStale } = useDataStore();
    const isValid = isCacheValid(jobsLastUpdated);

    return {
        jobs: isValid ? jobs : [],
        isValid,
        isStale: isStale || !isValid,
        lastUpdated: jobsLastUpdated,
    };
}

/**
 * Hook to get cached applications with validity check
 */
export function useCachedApplications() {
    const { applications, applicationsLastUpdated, isStale } = useDataStore();
    const isValid = isCacheValid(applicationsLastUpdated);

    return {
        applications: isValid ? applications : [],
        isValid,
        isStale: isStale || !isValid,
        lastUpdated: applicationsLastUpdated,
    };
}

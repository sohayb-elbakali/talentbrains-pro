import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query Configuration
 * 
 * This is the SINGLE source of truth for QueryClient configuration.
 * Do NOT create additional QueryClient instances elsewhere.
 * 
 * Key features:
 * - Data loads ONCE and stays cached for a long time
 * - No refetch on tab switch or page navigation (smooth UX)
 * - Only refetch when explicitly triggered or data is stale
 * - Cached data is shown instantly when navigating back
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data stays fresh for 30 minutes - no unnecessary refetches
            staleTime: 30 * 60 * 1000, // 30 minutes

            // Keep cached data for 2 hours
            gcTime: 2 * 60 * 60 * 1000, // 2 hours

            // Retry configuration
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

            // DON'T refetch on window focus - data stays stable
            refetchOnWindowFocus: false,

            // DON'T refetch on mount if we have cached data
            refetchOnMount: false,

            // Only refetch on reconnect if data is stale
            refetchOnReconnect: 'always',

            // Use cached data first, fetch in background if needed
            networkMode: 'offlineFirst',

            // Don't throw errors, handle them in components
            throwOnError: false,
        },
        mutations: {
            retry: 1,
            retryDelay: 1000,
            networkMode: 'offlineFirst',
        },
    },
});

/**
 * Prefetch data on hover for instant navigation
 */
export const prefetchQuery = async (
    queryKey: unknown[],
    queryFn: () => Promise<unknown>,
    staleTime = 30 * 60 * 1000
) => {
    await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
    });
};

/**
 * Invalidate queries - forces refetch on next access
 */
export const invalidateQueries = (queryKey: unknown[]) => {
    queryClient.invalidateQueries({ queryKey });
};

/**
 * Set query data directly - useful for optimistic updates
 */
export const setQueryData = <T>(queryKey: unknown[], data: T) => {
    queryClient.setQueryData(queryKey, data);
};

/**
 * Get cached query data without triggering a fetch
 */
export const getQueryData = <T>(queryKey: unknown[]): T | undefined => {
    return queryClient.getQueryData(queryKey);
};

/**
 * Cancel ongoing query
 */
export const cancelQueries = (queryKey: unknown[]) => {
    queryClient.cancelQueries({ queryKey });
};

/**
 * Remove query from cache completely
 */
export const removeQueries = (queryKey: unknown[]) => {
    queryClient.removeQueries({ queryKey });
};

/**
 * Clear all queries (use on logout)
 */
export const clearAllQueries = () => {
    queryClient.clear();
};

export type { QueryClient };

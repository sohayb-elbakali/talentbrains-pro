import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query Configuration
 * 
 * This is the SINGLE source of truth for QueryClient configuration.
 * Do NOT create additional QueryClient instances elsewhere.
 * 
 * Key features:
 * - offlineFirst mode: Returns cached data immediately, refetches in background
 * - Long staleTime: Reduces unnecessary API calls
 * - Smart retry: Exponential backoff with max 3 retries
 * - Optimized gcTime: Keeps inactive data longer for navigation
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // How long data is considered "fresh" and won't trigger a refetch
            staleTime: 10 * 60 * 1000, // 10 minutes

            // How long inactive data stays in cache before garbage collection
            gcTime: 60 * 60 * 1000, // 1 hour (increased for better offline support)

            // Retry configuration
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus (reduces unnecessary calls)
            refetchOnWindowFocus: false,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,

            // Refetch when network reconnects
            refetchOnReconnect: true,

            // Use cached data first, then fetch in background
            networkMode: 'offlineFirst',

            // Don't throw errors, handle them in components
            throwOnError: false,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
            retryDelay: 1000,
            // Use offline-first for mutations too
            networkMode: 'offlineFirst',
        },
    },
});

/**
 * Prefetch data on hover for instant navigation
 * Use this when user hovers over navigation elements
 */
export const prefetchQuery = async (
    queryKey: unknown[],
    queryFn: () => Promise<unknown>,
    staleTime = 5 * 60 * 1000
) => {
    await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
    });
};

/**
 * Invalidate queries - forces refetch on next access
 * Use after mutations that affect the data
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
 * Cancel ongoing query - useful when component unmounts
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

// Export type for external use
export type { QueryClient };

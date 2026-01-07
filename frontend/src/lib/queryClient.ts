import { QueryClient } from '@tanstack/react-query';

// Optimized React Query configuration
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time - how long data is considered fresh
            staleTime: 5 * 60 * 1000, // 5 minutes

            // Cache time - how long inactive data stays in cache
            cacheTime: 10 * 60 * 1000, // 10 minutes

            // Retry failed requests
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,

            // Refetch on reconnect
            refetchOnReconnect: true,

            // Suspense mode for better loading states
            suspense: false,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
});

// Prefetch helper for hover interactions
export const prefetchQuery = async (queryKey: any[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000,
    });
};

// Invalidate queries helper
export const invalidateQueries = (queryKey: any[]) => {
    queryClient.invalidateQueries({ queryKey });
};

// Set query data helper for optimistic updates
export const setQueryData = (queryKey: any[], data: any) => {
    queryClient.setQueryData(queryKey, data);
};

// Get query data helper
export const getQueryData = (queryKey: any[]) => {
    return queryClient.getQueryData(queryKey);
};

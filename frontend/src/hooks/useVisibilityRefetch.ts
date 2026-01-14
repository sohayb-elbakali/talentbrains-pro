import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to handle page visibility changes and trigger smart refetches
 * 
 * Benefits:
 * - Refetches stale data when user returns to the tab
 * - Debounces rapid visibility changes to prevent excessive API calls
 * - Respects stale time configuration
 */
export function useVisibilityRefetch(options: {
    queryKeys?: string[][];
    debounceMs?: number;
    enabled?: boolean;
} = {}) {
    const { queryKeys, debounceMs = 1000, enabled = true } = options;
    const queryClient = useQueryClient();
    const lastRefetchTime = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleVisibilityChange = useCallback(() => {
        if (!enabled) return;

        // Only refetch when page becomes visible
        if (document.visibilityState !== 'visible') return;

        const now = Date.now();
        const timeSinceLastRefetch = now - lastRefetchTime.current;

        // Debounce: only refetch if enough time has passed
        if (timeSinceLastRefetch < debounceMs) return;

        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Slight delay to prevent immediate refetch on rapid tab switches
        timeoutRef.current = setTimeout(() => {
            lastRefetchTime.current = Date.now();

            if (queryKeys && queryKeys.length > 0) {
                // Refetch specific queries
                queryKeys.forEach(key => {
                    queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' });
                });
            } else {
                // Refetch all stale queries
                queryClient.invalidateQueries({ refetchType: 'active' });
            }
        }, 100);
    }, [queryClient, queryKeys, debounceMs, enabled]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also handle focus event as a fallback
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [handleVisibilityChange, enabled]);
}

/**
 * Global visibility refetch provider - use once at app root
 */
export function useGlobalVisibilityRefetch() {
    useVisibilityRefetch({ enabled: true, debounceMs: 2000 });
}

export default useVisibilityRefetch;

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Network status type
 */
type NetworkStatus = 'online' | 'offline' | 'slow';

/**
 * Options for resilient fetch operations
 */
interface ResilientFetchOptions {
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Base delay between retries in ms */
    retryDelay?: number;
    /** Whether to use exponential backoff */
    exponentialBackoff?: boolean;
    /** Timeout for each request in ms */
    timeout?: number;
    /** Whether to show loading state while retrying */
    showRetryLoading?: boolean;
    /** Callback when network goes offline */
    onOffline?: () => void;
    /** Callback when network comes back online */
    onOnline?: () => void;
    /** Callback on each retry attempt */
    onRetry?: (attempt: number, maxRetries: number) => void;
}

/**
 * Result of a resilient data fetch
 */
interface ResilientResult<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isRetrying: boolean;
    retryCount: number;
    networkStatus: NetworkStatus;
    refetch: () => Promise<void>;
}

/**
 * Hook for checking network status
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
        navigator.onLine ? 'online' : 'offline'
    );

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setNetworkStatus('online');
        };

        const handleOffline = () => {
            setIsOnline(false);
            setNetworkStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Function to check connection quality
    const checkConnectionQuality = useCallback(async (): Promise<NetworkStatus> => {
        if (!navigator.onLine) return 'offline';

        try {
            const start = Date.now();
            // Use a simple HEAD request to check connection
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch('/favicon.ico', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeoutId);
            const duration = Date.now() - start;

            // If request takes more than 2 seconds, connection is slow
            if (duration > 2000) {
                setNetworkStatus('slow');
                return 'slow';
            }

            setNetworkStatus('online');
            return 'online';
        } catch {
            // If we're still online according to browser but fetch failed
            if (navigator.onLine) {
                setNetworkStatus('slow');
                return 'slow';
            }
            setNetworkStatus('offline');
            return 'offline';
        }
    }, []);

    return { isOnline, networkStatus, checkConnectionQuality };
}

/**
 * Hook for resilient data fetching with retry logic and offline handling
 * Automatically retries failed requests and handles network issues gracefully
 */
export function useResilientFetch<T>(
    fetchFn: () => Promise<T>,
    dependencies: any[] = [],
    options: ResilientFetchOptions = {}
): ResilientResult<T> {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        exponentialBackoff = true,
        timeout = 30000,
        onOffline,
        onOnline,
        onRetry,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRetrying, setIsRetrying] = useState<boolean>(false);
    const [retryCount, setRetryCount] = useState<number>(0);
    const { isOnline, networkStatus } = useNetworkStatus();

    const abortControllerRef = useRef<AbortController | null>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef<boolean>(true);
    const lastFetchRef = useRef<number>(0);

    // Clean up function
    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
    }, []);

    // Calculate delay with exponential backoff
    const getRetryDelay = useCallback(
        (attempt: number): number => {
            if (exponentialBackoff) {
                // Exponential backoff with jitter
                const baseDelay = retryDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 1000;
                return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
            }
            return retryDelay;
        },
        [retryDelay, exponentialBackoff]
    );

    // Check if error is retryable
    const isRetryableError = useCallback((err: any): boolean => {
        // Network errors are always retryable
        if (!navigator.onLine) return true;
        if (err?.message?.includes('fetch')) return true;
        if (err?.message?.includes('network')) return true;
        if (err?.message?.includes('timeout')) return true;
        if (err?.message?.includes('abort')) return false; // Don't retry aborted requests

        // HTTP errors that are retryable
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        if (err?.status && retryableStatusCodes.includes(err.status)) return true;

        return false;
    }, []);

    // Core fetch function with retry logic
    const fetchWithRetry = useCallback(
        async (attempt: number = 0): Promise<void> => {
            if (!mountedRef.current) return;

            // Don't start new fetch if offline
            if (!navigator.onLine) {
                setError(new Error('No internet connection'));
                setIsLoading(false);
                return;
            }

            // Create new abort controller for this request
            cleanup();
            abortControllerRef.current = new AbortController();

            // Set timeout
            const timeoutId = setTimeout(() => {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            }, timeout);

            try {
                setIsLoading(true);
                if (attempt > 0) {
                    setIsRetrying(true);
                    setRetryCount(attempt);
                    onRetry?.(attempt, maxRetries);
                }

                const result = await fetchFn();

                if (!mountedRef.current) return;

                clearTimeout(timeoutId);
                setData(result);
                setError(null);
                setIsRetrying(false);
                setRetryCount(0);
                lastFetchRef.current = Date.now();
            } catch (err: any) {
                if (!mountedRef.current) return;

                clearTimeout(timeoutId);

                // Don't treat aborted requests as errors (unless not online)
                if (err?.name === 'AbortError' && navigator.onLine) {
                    return;
                }

                console.log(`Fetch attempt ${attempt + 1} failed:`, err?.message);

                // Check if we should retry
                if (attempt < maxRetries && isRetryableError(err)) {
                    const delay = getRetryDelay(attempt);
                    console.log(`Retrying in ${delay}ms...`);

                    retryTimeoutRef.current = setTimeout(() => {
                        if (mountedRef.current && navigator.onLine) {
                            fetchWithRetry(attempt + 1);
                        }
                    }, delay);
                } else {
                    // Max retries reached or non-retryable error
                    setError(err instanceof Error ? err : new Error(err?.message || 'Unknown error'));
                    setIsRetrying(false);
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [fetchFn, maxRetries, timeout, cleanup, getRetryDelay, isRetryableError, onRetry]
    );

    // Initial fetch
    useEffect(() => {
        mountedRef.current = true;
        fetchWithRetry(0);

        return () => {
            mountedRef.current = false;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies]);

    // Handle online/offline transitions
    useEffect(() => {
        if (!isOnline) {
            onOffline?.();
            // Don't clear data on offline - keep stale data
        } else if (error) {
            onOnline?.();
            // Automatically retry when coming back online
            console.log('Network restored, retrying...');
            fetchWithRetry(0);
        }
    }, [isOnline, error, onOffline, onOnline, fetchWithRetry]);

    // Manual refetch function
    const refetch = useCallback(async () => {
        setError(null);
        await fetchWithRetry(0);
    }, [fetchWithRetry]);

    return {
        data,
        error,
        isLoading,
        isRetrying,
        retryCount,
        networkStatus,
        refetch,
    };
}

/**
 * Hook for wrapping any async function with retry logic
 * Useful for one-off operations like form submissions
 */
export function useResilientAction<T, Args extends any[]>(
    actionFn: (...args: Args) => Promise<T>,
    options: ResilientFetchOptions = {}
) {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        exponentialBackoff = true,
        onRetry,
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const { isOnline, networkStatus } = useNetworkStatus();

    const execute = useCallback(
        async (...args: Args): Promise<{ data: T | null; error: Error | null }> => {
            if (!navigator.onLine) {
                const offlineError = new Error('No internet connection. Please check your network and try again.');
                setError(offlineError);
                return { data: null, error: offlineError };
            }

            setIsLoading(true);
            setError(null);

            const attemptAction = async (attempt: number): Promise<{ data: T | null; error: Error | null }> => {
                try {
                    if (attempt > 0) {
                        setIsRetrying(true);
                        setRetryCount(attempt);
                        onRetry?.(attempt, maxRetries);
                    }

                    const result = await actionFn(...args);
                    setIsRetrying(false);
                    setRetryCount(0);
                    return { data: result, error: null };
                } catch (err: any) {
                    // Check if retryable
                    const isRetryable =
                        !navigator.onLine ||
                        err?.message?.includes('fetch') ||
                        err?.message?.includes('network') ||
                        err?.message?.includes('timeout');

                    if (attempt < maxRetries && isRetryable) {
                        // Calculate delay
                        const delay = exponentialBackoff
                            ? retryDelay * Math.pow(2, attempt) + Math.random() * 1000
                            : retryDelay;

                        console.log(`Action attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

                        await new Promise((resolve) => setTimeout(resolve, delay));

                        if (navigator.onLine) {
                            return attemptAction(attempt + 1);
                        }
                    }

                    const finalError = err instanceof Error ? err : new Error(err?.message || 'Action failed');
                    setError(finalError);
                    setIsRetrying(false);
                    return { data: null, error: finalError };
                }
            };

            try {
                return await attemptAction(0);
            } finally {
                setIsLoading(false);
            }
        },
        [actionFn, maxRetries, retryDelay, exponentialBackoff, onRetry]
    );

    return {
        execute,
        isLoading,
        isRetrying,
        retryCount,
        error,
        isOnline,
        networkStatus,
    };
}

/**
 * Store data locally as fallback when offline
 */
export function useOfflineStorage<T>(key: string, initialData: T | null = null) {
    const [data, setDataState] = useState<T | null>(() => {
        try {
            const stored = localStorage.getItem(`offline_${key}`);
            return stored ? JSON.parse(stored) : initialData;
        } catch {
            return initialData;
        }
    });

    const setData = useCallback(
        (newData: T | null) => {
            setDataState(newData);
            if (newData !== null) {
                try {
                    localStorage.setItem(`offline_${key}`, JSON.stringify(newData));
                } catch (err) {
                    console.warn('Failed to store offline data:', err);
                }
            } else {
                localStorage.removeItem(`offline_${key}`);
            }
        },
        [key]
    );

    const clearData = useCallback(() => {
        setDataState(null);
        localStorage.removeItem(`offline_${key}`);
    }, [key]);

    return { data, setData, clearData };
}

/**
 * Get React Query options based on network status
 * Use this to configure queries to be network-aware
 */
export function useNetworkAwareQueryOptions() {
    const { isOnline, networkStatus } = useNetworkStatus();

    return {
        /**
         * Return query options that pause when offline
         */
        getQueryOptions: <T>(options: {
            staleTime?: number;
            gcTime?: number;
            refetchOnMount?: boolean;
            refetchOnWindowFocus?: boolean;
        } = {}) => ({
            ...options,
            staleTime: options.staleTime ?? 10 * 60 * 1000,
            gcTime: options.gcTime ?? 60 * 60 * 1000,
            refetchOnMount: options.refetchOnMount ?? false,
            refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst' as const,
            // Keep retrying when slow connection
            retry: networkStatus === 'slow' ? 5 : 3,
            retryDelay: (attempt: number) => {
                const baseDelay = networkStatus === 'slow' ? 2000 : 1000;
                return Math.min(baseDelay * Math.pow(2, attempt), 30000);
            },
        }),

        /**
         * Determine if queries should be paused
         */
        isPaused: !isOnline,

        /**
         * Current network status
         */
        isOnline,
        networkStatus,
    };
}

/**
 * Hook to sync React Query with network status
 * Returns configuration for optimal offline-first behavior
 */
export function useQueryNetworkConfig() {
    const { isOnline, networkStatus, checkConnectionQuality } = useNetworkStatus();

    return {
        isOnline,
        networkStatus,
        checkConnectionQuality,

        /**
         * Default query options for offline-first behavior
         */
        defaultQueryOptions: {
            staleTime: 10 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst' as const,
            retry: 3,
            retryDelay: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000),
        },

        /**
         * Aggressive caching for data that changes rarely
         */
        longCacheOptions: {
            staleTime: 30 * 60 * 1000, // 30 minutes
            gcTime: 2 * 60 * 60 * 1000, // 2 hours
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst' as const,
        },

        /**
         * Real-time data that needs frequent updates
         */
        realtimeOptions: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnMount: true,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst' as const,
        },
    };
}

export default {
    useNetworkStatus,
    useResilientFetch,
    useResilientAction,
    useOfflineStorage,
    useNetworkAwareQueryOptions,
    useQueryNetworkConfig,
};

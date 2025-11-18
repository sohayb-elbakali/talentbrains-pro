import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { withNetworkErrorHandling, shouldShowOfflineUI } from '../utils/networkErrorHandler';

interface NetworkAwareQueryOptions<TData, TError = unknown>
  extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  queryFn: () => Promise<TData>;
  fallbackData?: TData;
  showErrorNotification?: boolean;
  retryOnReconnect?: boolean;
}

/**
 * Enhanced useQuery hook with network error handling
 * - Automatically retries with exponential backoff
 * - Preserves stale data on network errors
 * - Shows offline UI when appropriate
 * - Retries when connection is restored
 */
export function useNetworkAwareQuery<TData = unknown, TError = unknown>(
  options: NetworkAwareQueryOptions<TData, TError>
): UseQueryResult<TData, TError> & { isOffline: boolean; hasStaleData: boolean } {
  const {
    queryFn,
    fallbackData,
    showErrorNotification = false,
    retryOnReconnect = true,
    ...queryOptions
  } = options;

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasStaleData, setHasStaleData] = useState(false);

  // Enhanced query function with network error handling
  const enhancedQueryFn = async (): Promise<TData> => {
    const result = await withNetworkErrorHandling(queryFn, {
      fallbackData,
      showErrorNotification,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
      },
    });

    if (result.fromCache) {
      setHasStaleData(true);
    } else {
      setHasStaleData(false);
    }

    if (result.error && !result.data) {
      throw result.error;
    }

    return result.data as TData;
  };

  const queryResult = useQuery<TData, TError>({
    ...queryOptions,
    queryFn: enhancedQueryFn,
    retry: (failureCount, error: any) => {
      // Don't retry on non-network errors
      if (!error?.message?.includes('network') && !error?.message?.includes('fetch')) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Keep previous data while refetching
    placeholderData: (previousData) => previousData,
  });

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (retryOnReconnect && queryResult.isError) {
        queryResult.refetch();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryOnReconnect, queryResult]);

  return {
    ...queryResult,
    isOffline,
    hasStaleData,
  };
}

/**
 * Hook to check if we should show offline UI
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineUI, setShowOfflineUI] = useState(shouldShowOfflineUI());

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineUI(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineUI(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check periodically if we should show offline UI
    const interval = setInterval(() => {
      setShowOfflineUI(shouldShowOfflineUI());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOffline, showOfflineUI };
}

export default useNetworkAwareQuery;

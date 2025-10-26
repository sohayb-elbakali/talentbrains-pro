import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to handle data refresh when authentication state changes
 * This ensures components reload their data when the user returns to the app
 * or navigates between routes after potential session issues
 */
export const useDataRefresh = (
  refreshCallback: () => Promise<void> | void,
  dependencies: any[] = []
) => {
  const { user, profile, isAuthenticated } = useAuth();
  const lastRefreshRef = useRef<number>(0);
  const refreshCallbackRef = useRef(refreshCallback);

  // Update the callback ref when it changes
  useEffect(() => {
    refreshCallbackRef.current = refreshCallback;
  }, [refreshCallback]);

  // Refresh data when authentication state is established
  const refreshData = useCallback(async () => {
    if (!isAuthenticated || !user || !profile) {
      return;
    }

    const now = Date.now();
    // Prevent rapid successive refreshes (debounce for 1 second)
    if (now - lastRefreshRef.current < 1000) {
      return;
    }

    try {
      console.log('🔄 Refreshing component data...');
      lastRefreshRef.current = now;
      await refreshCallbackRef.current();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [isAuthenticated, user, profile]);

  // Refresh when auth state is fully established
  useEffect(() => {
    if (isAuthenticated && user && profile) {
      refreshData();
    }
  }, [isAuthenticated, user, profile, refreshData, ...dependencies]);

  // Refresh when the page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        console.log('🔄 Page became visible, refreshing data...');
        refreshData();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated) {
        console.log('🔄 Window focused, refreshing data...');
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, refreshData]);

  return { refreshData };
};

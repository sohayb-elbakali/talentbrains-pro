/**
 * NETWORK-AWARE QUERY USAGE EXAMPLES
 * 
 * This file demonstrates how to use the network error handling system
 * in your components for better UX during connectivity issues.
 */

import { useNetworkAwareQuery, useOfflineStatus } from '../hooks/useNetworkAwareQuery';
import { db } from '../lib/supabase';
import ErrorStateCard from '../components/ErrorStateCard';
import { motion } from 'framer-motion';

// ============================================
// EXAMPLE 1: Basic Network-Aware Query
// ============================================

export function JobsListExample() {
  const { data: jobs, isLoading, isError, error, refetch, isOffline, hasStaleData } = useNetworkAwareQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await db.getJobs();
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Data will be preserved even if network fails
    fallbackData: [],
  });

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  if (isError && !jobs?.length) {
    return <ErrorStateCard error={error} onRetry={refetch} />;
  }

  return (
    <div>
      {/* Show stale data indicator */}
      {hasStaleData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Showing cached data. Connection issues detected.
        </div>
      )}

      {/* Show offline indicator */}
      {isOffline && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Render jobs */}
      <div className="grid gap-4">
        {jobs?.map((job: any) => (
          <div key={job.id} className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold">{job.title}</h3>
            <p className="text-gray-600">{job.company_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: With Compact Error State
// ============================================

export function ApplicationsListExample() {
  const { data: applications, isError, error, refetch } = useNetworkAwareQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await db.getApplications();
      if (error) throw error;
      return data || [];
    },
    fallbackData: [],
  });

  return (
    <div>
      {isError && (
        <ErrorStateCard 
          error={error} 
          onRetry={refetch} 
          compact 
          title="Failed to load applications"
        />
      )}

      {/* Render applications */}
      <div className="space-y-4">
        {applications?.map((app: any) => (
          <div key={app.id} className="p-4 bg-white rounded-lg">
            {app.job?.title}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Using Offline Status Hook
// ============================================

export function DashboardExample() {
  const { isOffline, showOfflineUI } = useOfflineStatus();

  if (showOfflineUI) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorStateCard 
          error={{ message: 'No connection' }}
          title="You're Offline"
          message="Please check your internet connection to continue"
        />
      </div>
    );
  }

  return (
    <div>
      {isOffline && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 font-semibold">Limited Connectivity</p>
          <p className="text-yellow-700 text-sm">Some features may not work properly</p>
        </div>
      )}

      {/* Dashboard content */}
      <div>Dashboard content here...</div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Manual Retry with Network Handling
// ============================================

export function ProfileUpdateExample() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<any>(null);

  const handleUpdateProfile = async (updates: any) => {
    setIsUpdating(true);
    setError(null);

    try {
      // Use withNetworkErrorHandling for manual operations
      const { withNetworkErrorHandling } = await import('../utils/networkErrorHandler');
      
      const result = await withNetworkErrorHandling(
        async () => {
          const { data, error } = await db.updateProfile('user-id', updates);
          if (error) throw error;
          return data;
        },
        {
          showErrorNotification: true,
          errorMessage: 'Failed to update profile',
          retryConfig: {
            maxRetries: 3,
            initialDelay: 1000,
          },
        }
      );

      if (result.data) {
        // Success!
        console.log('Profile updated:', result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      {error && (
        <ErrorStateCard 
          error={error} 
          onRetry={() => handleUpdateProfile({})}
          compact
        />
      )}

      <button
        onClick={() => handleUpdateProfile({ full_name: 'New Name' })}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Graceful Degradation with Stale Data
// ============================================

export function TalentProfilesExample() {
  const { 
    data: talents, 
    isLoading, 
    isError, 
    error, 
    refetch,
    hasStaleData,
    isOffline 
  } = useNetworkAwareQuery({
    queryKey: ['talents'],
    queryFn: async () => {
      const { data, error } = await db.getTalents();
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    fallbackData: [], // Always show something
  });

  if (isLoading && !talents?.length) {
    return <div>Loading talents...</div>;
  }

  return (
    <div>
      {/* Status indicators */}
      {hasStaleData && !isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-800">
              Showing cached data due to connection issues
            </span>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-yellow-900 hover:underline"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {/* Error state (only if no data at all) */}
      {isError && !talents?.length && (
        <ErrorStateCard error={error} onRetry={refetch} />
      )}

      {/* Render talents (even if stale) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {talents?.map((talent: any) => (
          <div 
            key={talent.id} 
            className={`p-6 bg-white rounded-xl shadow ${
              hasStaleData ? 'opacity-75' : ''
            }`}
          >
            <h3 className="font-bold text-lg">{talent.profile?.full_name}</h3>
            <p className="text-gray-600">{talent.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 6: Custom Retry Logic
// ============================================

export function CustomRetryExample() {
  const { data, isError, error, refetch } = useNetworkAwareQuery({
    queryKey: ['custom-data'],
    queryFn: async () => {
      const { data, error } = await db.getJobs();
      if (error) throw error;
      return data;
    },
    // Custom retry logic
    retry: (failureCount, error: any) => {
      // Don't retry on 404
      if (error?.status === 404) return false;
      // Retry up to 5 times for network errors
      if (error?.message?.includes('network')) return failureCount < 5;
      // Default: retry 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  });

  if (isError) {
    return <ErrorStateCard error={error} onRetry={refetch} />;
  }

  return <div>{/* Render data */}</div>;
}

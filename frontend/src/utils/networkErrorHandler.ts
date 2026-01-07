/**
 * Network Error Handler with Exponential Backoff
 * Provides retry logic, offline detection, and graceful degradation
 */

import { notify } from './notify';

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

interface NetworkState {
  isOnline: boolean;
  lastOnlineCheck: number;
  failedRequests: number;
}

const networkState: NetworkState = {
  isOnline: navigator.onLine,
  lastOnlineCheck: Date.now(),
  failedRequests: 0,
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    networkState.isOnline = true;
    networkState.failedRequests = 0;
    notify.showSuccess('Connection restored');
  });

  window.addEventListener('offline', () => {
    networkState.isOnline = false;
    notify.showError('You are offline');
  });
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  return (
    !navigator.onLine ||
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ETIMEDOUT' ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError' && errorMessage.includes('failed to fetch')
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (isNetworkError(error)) return true;

  const status = error.status || error.statusCode;
  
  // Retry on 5xx errors and specific 4xx errors
  return (
    status === 408 || // Request Timeout
    status === 429 || // Too Many Requests
    status === 500 || // Internal Server Error
    status === 502 || // Bad Gateway
    status === 503 || // Service Unavailable
    status === 504    // Gateway Timeout
  );
}

/**
 * Calculate delay for exponential backoff
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = isRetryableError,
  } = config;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if we're online before attempting
      if (!navigator.onLine && attempt > 0) {
        await sleep(1000);
        continue;
      }

      const result = await fn();
      
      // Reset failed requests counter on success
      if (networkState.failedRequests > 0) {
        networkState.failedRequests = 0;
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      networkState.failedRequests++;

      // Don't retry if it's not a retryable error
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, initialDelay, maxDelay, backoffMultiplier);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Wrapper for API calls with automatic retry and error handling
 */
export async function withNetworkErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    retryConfig?: RetryConfig;
    fallbackData?: T;
    showErrorNotification?: boolean;
    errorMessage?: string;
  } = {}
): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
  const {
    retryConfig,
    fallbackData,
    showErrorNotification = true,
    errorMessage,
  } = options;

  try {
    const data = await retryWithBackoff(fn, retryConfig);
    return { data, error: null };
  } catch (error: any) {
    console.error('Network error:', error);

    // Show appropriate error notification
    if (showErrorNotification) {
      if (isNetworkError(error)) {
        if (!navigator.onLine) {
          notify.showError('You are offline');
        } else {
          notify.showNetworkError();
        }
      } else if (errorMessage) {
        notify.showError(errorMessage);
      } else {
        notify.showError('Failed to load data');
      }
    }

    // Return fallback data if available
    if (fallbackData !== undefined) {
      return { data: fallbackData, error, fromCache: true };
    }

    return { data: null, error };
  }
}

/**
 * Get network state
 */
export function getNetworkState(): NetworkState {
  return { ...networkState };
}

/**
 * Check if we should show offline UI
 */
export function shouldShowOfflineUI(): boolean {
  return !networkState.isOnline || networkState.failedRequests >= 3;
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig?: RetryConfig
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.statusCode = response.status;
        throw error;
      }
      
      return response;
    },
    retryConfig
  );
}

/**
 * Create a network-aware query function for React Query
 */
export function createNetworkAwareQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    retryConfig?: RetryConfig;
    fallbackData?: T;
  } = {}
) {
  return async (): Promise<T> => {
    const result = await withNetworkErrorHandling(queryFn, {
      retryConfig: options.retryConfig,
      fallbackData: options.fallbackData,
      showErrorNotification: false, // Let React Query handle errors
    });

    if (result.error && !result.data) {
      throw result.error;
    }

    return result.data as T;
  };
}

export default {
  retryWithBackoff,
  withNetworkErrorHandling,
  isNetworkError,
  isRetryableError,
  getNetworkState,
  shouldShowOfflineUI,
  fetchWithRetry,
  createNetworkAwareQuery,
};

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * React Query Persister Configuration
 * 
 * This persister saves query cache to localStorage, enabling:
 * - Instant data display on page navigation
 * - Data persistence across browser refresh
 * - Offline data availability
 */

// Create the localStorage persister
export const queryPersister = createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'REACT_QUERY_OFFLINE_CACHE',
    // Throttle writes to localStorage (default: 1000ms)
    throttleTime: 1000,
    // Serialize/deserialize functions
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data),
});

/**
 * Persist options for the query client
 * Controls what gets persisted and for how long
 */
export const persistOptions = {
    persister: queryPersister,
    // Maximum age of persisted data (1 hour)
    maxAge: 1000 * 60 * 60,
    // Only persist successful queries
    dehydrateOptions: {
        shouldDehydrateQuery: (query: any) => {
            // Only persist queries that succeeded and have data
            return query.state.status === 'success' && query.state.data !== undefined;
        },
    },
    // Persist when the window is hidden (user switches tabs)
    buster: '',
};

/**
 * Query keys that should NOT be persisted
 * (sensitive data or real-time data that should always be fresh)
 */
export const nonPersistableQueryKeys = [
    'admin-stats', // Admin stats should always be fresh
    'real-time-', // Any real-time subscriptions
];

/**
 * Check if a query should be persisted
 */
export function shouldPersistQuery(queryKey: unknown[]): boolean {
    const keyString = JSON.stringify(queryKey);
    return !nonPersistableQueryKeys.some(key => keyString.includes(key));
}

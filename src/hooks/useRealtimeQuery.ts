import { useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface RealtimeQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: any[];
  queryFn: () => Promise<T>;
  table?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

/**
 * Custom hook that combines React Query with Supabase real-time subscriptions
 * This prevents unnecessary refetches and keeps data in sync automatically
 */
export function useRealtimeQuery<T>({
  queryKey,
  queryFn,
  table,
  filter,
  event = '*',
  ...queryOptions
}: RealtimeQueryOptions<T>) {
  const queryClient = useQueryClient();

  // Use React Query for data fetching and caching
  const query = useQuery({
    queryKey,
    queryFn,
    ...queryOptions,
  });

  // Set up real-time subscription if table is provided
  useEffect(() => {
    if (!table) return;

    const channel = supabase
      .channel(`${table}-changes-${queryKey.join('-')}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        () => {
          // Invalidate and refetch when changes occur
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, queryKey, queryClient]);

  return query;
}

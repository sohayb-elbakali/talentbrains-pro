import { useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

interface RealtimeQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: any[];
  queryFn: () => Promise<T>;
  table?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export function useRealtimeQuery<T>({
  queryKey,
  queryFn,
  table,
  filter,
  event = '*',
  ...queryOptions
}: RealtimeQueryOptions<T>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Always execute the query function to get fresh data
      // React Query handles caching internally based on staleTime
      return queryFn();
    },
    // Allow refetches when query is invalidated
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    ...queryOptions,
  });

  useEffect(() => {
    if (!table) return;

    const tables = table.split(',').map(t => t.trim());
    const channels = tables.map(tableName => {
      const channel = supabase
        .channel(`${tableName}-${queryKey.join('-')}`)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table: tableName,
            ...(filter && { filter }),
          },
          () => {
            // Invalidate and refetch immediately when realtime event occurs
            queryClient.invalidateQueries({ queryKey, exact: false });
            queryClient.refetchQueries({ queryKey, exact: false });
          }
        )
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [table, filter, event, queryKey, queryClient]);

  return query;
}

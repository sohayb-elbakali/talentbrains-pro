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
      // Return cached data if available and fresh
      const cachedData = queryClient.getQueryData<T>(queryKey);
      if (cachedData) {
        return cachedData;
      }
      return queryFn();
    },
    // Prevent unnecessary refetches
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 60 * 1000, // 30 minutes default
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
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
            queryClient.invalidateQueries({ queryKey, exact: false });
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

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
      const cachedData = queryClient.getQueryData<T>(queryKey);
      if (cachedData) {
        return cachedData;
      }
      return queryFn();
    },
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

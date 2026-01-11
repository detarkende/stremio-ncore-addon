import { queryOptions } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import type { User } from '@sna/server';
import { QueryKeys } from '../keys';
import { apiClient } from '@/integrations/api';

async function fetchMe({ signal }: { signal: AbortSignal }): Promise<User | null> {
  const response = await apiClient.api.users.me.$get({}, { init: { signal } });
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    } else {
      throw new Error('Failed to fetch user profile');
    }
  }
  return await response.json();
}

export const meOrNullQueryOptions = queryOptions({
  queryKey: [QueryKeys.ME],
  queryFn: fetchMe,
});

export const meQueryOptions = queryOptions({
  queryKey: [QueryKeys.ME],
  queryFn: async (context) => {
    const me = await fetchMe(context);
    if (!me) {
      throw redirect({ to: '/login' });
    }
    return me;
  },
});

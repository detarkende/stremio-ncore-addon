import { apiClient } from '@client/integrations/api';
import type { User } from '@server/exports';
import { queryOptions } from '@tanstack/react-query';

import { QueryKeys } from '../keys';

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

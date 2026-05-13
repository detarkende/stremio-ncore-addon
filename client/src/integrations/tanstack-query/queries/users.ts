import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/integrations/api';

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await apiClient.api.users.$get();
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  },
});

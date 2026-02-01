import { queryOptions } from '@tanstack/react-query';
import { QueryKeys } from '../keys';
import { apiClient } from '@/integrations/api';
import { handleHttpError } from '@/utils/http';

export const torrentsQueryOptions = queryOptions({
  queryKey: [QueryKeys.TORRENTS],
  queryFn: async () => {
    const response = await apiClient.api.torrents.$get();
    if (!response.ok) {
      await handleHttpError(response);
    }
    return await response.json();
  },
});

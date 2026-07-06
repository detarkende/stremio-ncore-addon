import { apiClient } from '@client/integrations/api';
import { handleHttpError } from '@client/utils/http';
import { queryOptions } from '@tanstack/react-query';

import { QueryKeys } from '../keys';

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

import { apiClient } from '@client/integrations/api';
import { handleHttpError } from '@client/utils/http';
import { queryOptions } from '@tanstack/react-query';

import { QueryKeys } from '../keys';

export const isConfiguredQueryOptions = queryOptions({
  queryKey: [QueryKeys.IS_CONFIGURED],
  queryFn: async (context) => {
    const response = await apiClient.api.config['is-configured'].$get(
      {},
      { init: { signal: context.signal } },
    );
    if (!response.ok) {
      await handleHttpError(response);
    }
    const data: { isConfigured: boolean } = await response.json();
    return data.isConfigured;
  },
});

export const configQueryOptions = queryOptions({
  queryKey: [QueryKeys.CONFIG],
  queryFn: async (context) => {
    const response = await apiClient.api.config.$get(
      {},
      {
        init: { signal: context.signal },
      },
    );
    if (!response.ok) {
      await handleHttpError(response);
    }
    const data = await response.json();
    return data;
  },
});

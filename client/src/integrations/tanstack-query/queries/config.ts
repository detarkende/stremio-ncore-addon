import { queryOptions } from '@tanstack/react-query';
import type { ConfigurationResponse } from '@sna/server';
import { QueryKeys } from '../keys';
import { apiClient } from '@/integrations/api';
import { handleHttpError } from '@/utils/http';

export const isConfiguredQueryOptions = queryOptions({
  queryKey: [QueryKeys.IS_CONFIGURED],
  queryFn: async (context) => {
    const response = await apiClient.api.config['is-configured'].$get(
      {},
      { init: { signal: context.signal } },
    );
    if (!response.ok) {
      handleHttpError(response);
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
      { init: { signal: context.signal } },
    );
    if (!response.ok) {
      handleHttpError(response);
    }
    const data: ConfigurationResponse = await response.json();
    return data;
  },
});

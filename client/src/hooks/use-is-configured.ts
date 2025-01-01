import { api } from '@/api';
import { QueryKeys } from '@/constants/query-keys';
import { useQuery } from '@tanstack/react-query';

export const useIsConfigured = () => {
  const query = useQuery({
    queryKey: [QueryKeys.CONFIG],
    queryFn: async () => {
      const req = await api.config['is-configured'].$get();
      const { isConfigured } = await req.json();
      return isConfigured;
    },
    retry: false,
  });
  return { ...query, isConfigured: query.data };
};

import { api } from '@/api';
import { QueryKeys } from '@/constants/query-keys';
import { useQuery } from '@tanstack/react-query';

export const useConfig = () => {
  const query = useQuery({
    queryKey: [QueryKeys.CONFIG],
    queryFn: async () => {
      const req = await api.config.$get();
      return req.json();
    },
  });
  const { data: config, ...rest } = query;
  return { config, ...rest };
};

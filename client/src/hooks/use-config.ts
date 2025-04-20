import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { QueryKeys } from '@/constants/query-keys';

export const useConfig = () => {
  const query = useQuery({
    queryKey: [QueryKeys.CONFIG],
    queryFn: async () => {
      const req = await api.config.$get();
      return req.json();
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: config, ...rest } = query;
  return { config, ...rest };
};

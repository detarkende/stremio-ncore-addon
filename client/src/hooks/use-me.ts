import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const ME_QUERY_KEY = 'me';

export const useMe = (jwt: string | null) => {
  const query = useQuery({
    queryKey: [ME_QUERY_KEY],
    queryFn: async () => {
      const req = await api.api.auth[':jwt'].me.$get({ param: { jwt: jwt ?? '' } });
      return await req.json();
    },
    enabled: !!jwt,
  });
  return query;
};

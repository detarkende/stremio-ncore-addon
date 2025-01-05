import { api } from '@/api';
import { QueryKeys } from '@/constants/query-keys';
import { handleError, HttpError } from '@/lib/errors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useMe = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: logout } = useMutation({
    mutationFn: async () => {
      const req = await api.logout.$post();
      if (!req.ok) {
        throw new HttpError(req);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ME] });
      toast.info('Signing you out');
    },
    onError: (e) => handleError(e, 'Failed to logout'),
  });
  const query = useQuery({
    queryKey: [QueryKeys.ME],
    queryFn: async () => {
      const req = await api.me.$get();
      if (!req.ok) {
        return null;
      }
      return await req.json();
    },
  });
  return { ...query, logout, me: query.data };
};

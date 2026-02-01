import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToast, Button } from '@heroui/react';
import { useRouter } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import { apiClient } from '@/integrations/api';
import { handleHttpError } from '@/utils/http';
import { QueryKeys } from '@/integrations/tanstack-query/keys';

export function LogoutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.logout.$post();
      const isSuccess = response.ok || response.status === 401;
      if (!isSuccess) {
        await handleHttpError(response);
      }
    },
  });

  const logout = async () => {
    try {
      await mutateAsync();
      addToast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
        color: 'success',
        timeout: 5000,
      });
      await queryClient.refetchQueries({ queryKey: [QueryKeys.ME] });
      await router.invalidate();
    } catch (error) {
      addToast({
        title: 'Logout failed',
        description: (error as Error).message,
        color: 'danger',
        timeout: 10_000,
      });
    }
  };

  return (
    <Button color="danger" onPress={logout} variant="light" className="text-large">
      <LogOutIcon size={16} />
      Logout
    </Button>
  );
}

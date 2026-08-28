import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { addToast, Button } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';

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
    <Button
      color="danger"
      onPress={logout}
      variant="light"
      className="text-large px-0 sm:px-4"
    >
      <LogOutIcon size={16} />
      Logout
    </Button>
  );
}

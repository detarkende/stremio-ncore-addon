import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { Button, toast } from '@heroui/react';
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
      toast.success('Logged out', {
        description: 'You have been successfully logged out.',
        timeout: 5000,
      });
      await queryClient.refetchQueries({ queryKey: [QueryKeys.ME] });
      await router.invalidate();
    } catch (error) {
      toast.danger('Logout failed', {
        description: (error as Error).message,
        timeout: 10_000,
      });
    }
  };

  return (
    <Button
      onPress={logout}
      variant="ghost"
      size="lg"
      className="text-danger hover:bg-danger-soft-hover -mr-4 -mt-2 sm:mr-0 sm:mt-0"
    >
      <LogOutIcon />
      Logout
    </Button>
  );
}

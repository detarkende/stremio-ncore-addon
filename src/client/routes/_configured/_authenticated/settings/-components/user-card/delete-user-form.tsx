import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { addToast, Button } from '@heroui/react';
import { type User } from '@server/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function DeleteUser({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.users[':userId'].$delete({
        param: { userId: `${user.id}` },
      });
      if (!response.ok) {
        await handleHttpError(response);
      }
    },
  });

  const handleDelete = async () => {
    try {
      await mutateAsync();
      await queryClient.refetchQueries({ queryKey: [QueryKeys.USERS] });
      addToast({
        title: 'User deleted',
        description: `User "${user.username}" has been deleted successfully.`,
        color: 'success',
        timeout: 5000,
      });
    } catch (error) {
      addToast({
        title: `Failed to delete user "${user.username}"`,
        description: (error as Error).message,
        color: 'danger',
        timeout: 10_000,
      });
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <Text as="h3" variant="heading-sm">
        Are you sure you want to delete this user?
      </Text>
      <div className="flex gap-4">
        <Button color="danger" onPress={handleDelete}>
          Delete User
        </Button>
        <Button variant="flat" color="default" onPress={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

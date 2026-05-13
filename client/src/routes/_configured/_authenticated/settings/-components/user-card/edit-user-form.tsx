import { addToast, Button } from '@heroui/react';
import { updateUserSchema, type UpdateUserRequest, type User } from '@sna/server';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppForm } from '@/components/form';
import { UpdateUserFields } from '@/components/form/field-groups/update-user-fields';
import { apiClient } from '@/integrations/api';
import { QueryKeys } from '@/integrations/tanstack-query/keys';
import { handleHttpError } from '@/utils/http';

export function EditUserForm({
  user,
  isMe,
  onClose,
}: {
  user: User;
  isMe: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (data: UpdateUserRequest) => {
      const request = await apiClient.api.users[':userId'].$put({
        param: { userId: `${user.id}` },
        json: data,
      });
      if (!request.ok) {
        await handleHttpError(request);
      }
      return await request.json();
    },
  });
  const form = useAppForm({
    validators: {
      onChange: updateUserSchema,
    },
    defaultValues: {
      username: user.username,
      preferredLanguage: user.preferredLanguage,
      preferredResolutions: user.preferredResolutions,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value);
        await queryClient.invalidateQueries({ queryKey: [QueryKeys.USERS] });
        if (isMe) {
          await queryClient.invalidateQueries({ queryKey: [QueryKeys.ME] });
        }
        await queryClient.refetchQueries();
        addToast({
          title: 'User updated',
          description: isMe
            ? 'Your user details have been updated successfully.'
            : `User details for "${user.username}" have been updated successfully.`,
          color: 'success',
          timeout: 5000,
        });
        onClose();
      } catch (error) {
        addToast({
          title: isMe
            ? 'Failed to update your user details'
            : `Failed to update user "${user.username}"`,
          description: (error as Error).message,
          color: 'danger',
          timeout: 10_000,
        });
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.AppForm>
        <UpdateUserFields
          form={form}
          fields={{
            username: 'username',
            preferredLanguage: 'preferredLanguage',
            preferredResolutions: 'preferredResolutions',
          }}
        />
        <div className="flex gap-4">
          <form.SubmitButton color="primary" buttonMode="update">
            Update User
          </form.SubmitButton>
          <Button onPress={onClose} type="button">
            Cancel
          </Button>
        </div>
      </form.AppForm>
    </form>
  );
}

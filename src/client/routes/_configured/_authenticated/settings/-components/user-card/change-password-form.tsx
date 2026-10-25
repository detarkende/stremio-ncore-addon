import { useAppForm } from '@client/components/form';
import { apiClient } from '@client/integrations/api';
import { handleHttpError } from '@client/utils/http';
import { Button, toast } from '@heroui/react';
import {
  updatePasswordSchema,
  type UpdatePasswordRequest,
  type User,
} from '@server/exports';
import { useMutation } from '@tanstack/react-query';

export function ChangePasswordForm({
  user,
  isMe,
  onClose,
}: {
  user: User;
  isMe: boolean;
  onClose: () => void;
}) {
  const { mutateAsync } = useMutation({
    mutationFn: async (data: UpdatePasswordRequest) => {
      const request = await apiClient.api.users[':userId'].password.$put({
        param: { userId: `${user.id}` },
        json: data,
      });
      if (!request.ok) {
        await handleHttpError(request);
      }
    },
  });
  const form = useAppForm({
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value);
        toast.success('Password updated', {
          description: isMe
            ? `Your password has been updated successfully.`
            : `Password for user "${user.username}" has been updated successfully.`,
          timeout: 5000,
        });
        onClose();
      } catch (error) {
        toast.danger(
          isMe
            ? 'Failed to update your password'
            : `Failed to update password for user "${user.username}"`,
          {
            description: (error as Error).message,
            timeout: 10_000,
          },
        );
      }
    },
    validators: {
      onChange: updatePasswordSchema,
    },
    defaultValues: {
      password: '',
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppForm>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                type="password"
                isRequired
                label="New password"
                autoComplete="new-password"
              />
            )}
          </form.AppField>
        </div>
        <div className="flex gap-4">
          <form.SubmitButton>Change Password</form.SubmitButton>
          <Button type="button" onPress={onClose}>
            Cancel
          </Button>
        </div>
      </form.AppForm>
    </form>
  );
}

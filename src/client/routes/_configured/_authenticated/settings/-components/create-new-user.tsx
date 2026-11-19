import { useAppForm } from '@client/components/form';
import {
  CreateUserFields,
  createUserFormDefaultValues,
} from '@client/components/form/field-groups/create-user-fields';
import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { Button, Card, toast } from '@heroui/react';
import { createUserSchema, type CreateUserRequest } from '@server/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

export function CreateNewUser() {
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const closeForm = () => setIsCreateFormVisible(false);
  const openForm = () => setIsCreateFormVisible(true);

  return (
    <div className="space-y-4">
      <Button className="w-fit" isDisabled={isCreateFormVisible} onPress={openForm}>
        <PlusIcon /> Create new user
      </Button>
      {isCreateFormVisible && <CreateUserForm onClose={closeForm} />}
    </div>
  );
}

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await apiClient.api.users.$post({ json: data });
      if (!response.ok) {
        await handleHttpError(response);
      }
    },
  });
  const form = useAppForm({
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value);
        toast.success('User created successfully', {
          description: `User "${value.username}" has been created.`,
          timeout: 5000,
        });
        await queryClient.refetchQueries({ queryKey: [QueryKeys.USERS] });
        onClose();
      } catch (error) {
        toast.danger('Failed to create user', {
          description: (error as Error).message,
          timeout: 5000,
        });
      }
    },
    defaultValues: createUserFormDefaultValues,
    validators: { onChange: createUserSchema },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="rounded-xl"
    >
      <Card className="space-y-4 rounded-xl p-4">
        <Text as="h3" variant="heading-md">
          Create new user
        </Text>
        <form.AppForm>
          <CreateUserFields
            form={form}
            fields={{
              username: 'username',
              password: 'password',
              preferredLanguage: 'preferredLanguage',
              preferredResolutions: 'preferredResolutions',
            }}
          />
          <div className="flex gap-4">
            <form.SubmitButton>Create User</form.SubmitButton>
            <Button
              type="button"
              variant="tertiary"
              onPress={() => {
                form.reset();
                onClose();
              }}
            >
              Cancel
            </Button>
          </div>
        </form.AppForm>
      </Card>
    </form>
  );
}

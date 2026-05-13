import { addToast, Button, Card } from '@heroui/react';
import { createUserSchema, type CreateUserRequest } from '@sna/server';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAppForm } from '@/components/form';
import {
  CreateUserFields,
  createUserFormDefaultValues,
} from '@/components/form/field-groups/create-user-fields';
import { Text } from '@/components/text';
import { apiClient } from '@/integrations/api';
import { QueryKeys } from '@/integrations/tanstack-query/keys';
import { handleHttpError } from '@/utils/http';

export function CreateNewUser() {
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const closeForm = () => setIsCreateFormVisible(false);
  const openForm = () => setIsCreateFormVisible(true);

  return (
    <div className="space-y-4">
      <Button className="w-fit" isDisabled={isCreateFormVisible} onPress={openForm}>
        Create new user
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
        addToast({
          color: 'success',
          title: 'User created successfully',
          description: `User "${value.username}" has been created.`,
          timeout: 5000,
        });
        await queryClient.refetchQueries({ queryKey: [QueryKeys.USERS] });
        onClose();
      } catch (error) {
        addToast({
          color: 'danger',
          title: 'Failed to create user',
          description: (error as Error).message,
          timeout: 5000,
        });
      }
    },
    defaultValues: createUserFormDefaultValues,
    validators: { onChange: createUserSchema },
  });
  return (
    <Card
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="p-4 rounded-xl space-y-4"
    >
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
          <form.SubmitButton color="primary">Create User</form.SubmitButton>
          <Button
            type="button"
            variant="flat"
            color="default"
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
  );
}

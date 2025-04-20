import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema } from '@server/schemas/user.schema';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Language } from '@server/db/schema/users';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateUserRequest } from '@server/types/user';
import { toast } from 'sonner';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MutationKeys } from '@/constants/mutation-keys';
import { api } from '@/api';
import { UserFields } from '@/pages/setup/components/user-fields';
import { QueryKeys } from '@/constants/query-keys';
import { handleError, HttpError } from '@/lib/errors';

const createUserFormSchema = z.object({
  user: createUserSchema,
});

type CreateUserFormProps = z.infer<typeof createUserFormSchema>;

export const CreateUserForm = ({ closeModal }: { closeModal: () => void }) => {
  const queryClient = useQueryClient();
  const form = useForm<CreateUserFormProps>({
    resolver: zodResolver(createUserFormSchema),
    mode: 'all',
    defaultValues: {
      user: {
        username: '',
        password: '',
        preferredLanguage: Language.EN,
        preferredResolutions: [],
      },
    },
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const req = await api.users.$post({
        json: data,
      });
      if (!req.ok) {
        throw new HttpError(req);
      }
      await req.json();
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USERS] });
    },
    onError: (e) => handleError(e, 'Failed to create user'),
    mutationKey: [MutationKeys.CREATE_USER],
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data.user);
    closeModal();
    toast.success('User created successfully');
  });

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <UserFields baseName="user" />
        <DialogFooter>
          <DialogClose>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
};

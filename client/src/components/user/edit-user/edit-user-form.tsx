import { UserFields } from '@/pages/setup/components/user-fields';
import { zodResolver } from '@hookform/resolvers/zod';
import { editUserSchema } from '@server/schemas/user.schema';
import { User } from '@server/types/user';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { toast } from 'sonner';
import { QueryKeys } from '@/constants/query-keys';
import { handleError, HttpError } from '@/lib/errors';

const editUserFormSchema = z.object({
  user: editUserSchema,
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export const EditUserForm = ({
  user,
  closeModal,
}: {
  user: User;
  closeModal: () => void;
}) => {
  const queryClient = useQueryClient();
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    mode: 'onChange',
    defaultValues: {
      user,
    },
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (data: EditUserFormValues) => {
      const req = await api.users[':userId'].$put({
        json: data.user,
        param: { userId: `${user.id}` },
      });
      if (!req.ok) {
        throw new HttpError(req);
      }
      return await req.json();
    },
    onError: (e) => handleError(e, 'Failed to update user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USERS] });
      toast.success('User updated successfully');
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data);
    closeModal();
  });

  return (
    <FormProvider {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <UserFields baseName="user" hidePassword />
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

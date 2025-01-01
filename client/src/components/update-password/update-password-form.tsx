import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MutationKeys } from '@/constants/mutation-keys';
import { handleError, HttpError } from '@/lib/errors';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordSchema } from '@server/schemas/user.schema';
import { UpdatePasswordRequest, User } from '@server/types/user';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

export const UpdatePasswordForm = ({
  user,
  closeModal,
}: {
  user: User;
  closeModal: () => void;
}) => {
  const form = useForm<UpdatePasswordRequest>({
    mode: 'onChange',
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
    },
  });
  const { mutateAsync } = useMutation({
    mutationFn: async (data: UpdatePasswordRequest) => {
      const req = await api.users[':userId'].password.$put({
        json: data,
        param: { userId: `${user.id}` },
      });
      if (!req.ok) {
        throw new HttpError(req);
      }
      return await req.json();
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (e) => handleError(e, 'Failed to update password'),
    mutationKey: [MutationKeys.UPDATE_USER, user.id],
  });
  const onSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data);
    closeModal();
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <Input {...field} type="password" autoComplete="new-password" />
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
      <DialogFooter>
        <DialogClose>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <Button
          disabled={!form.formState.isDirty || !form.formState.isValid}
          type="submit"
        >
          Save
        </Button>
      </DialogFooter>
    </FormProvider>
  );
};

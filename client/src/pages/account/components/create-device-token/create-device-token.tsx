import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  CreateDeviceTokenFormValues,
  createDeviceTokenSchema,
  defaultCreateDeviceTokenFormValues,
} from './constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { MutationKeys } from '@/constants/mutation-keys';
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { QueryKeys } from '@/constants/query-keys';

const CreateDeviceTokenForm = ({
  closeDialog,
  setOpenedDeviceToken,
}: {
  closeDialog: () => void;
  setOpenedDeviceToken: (token: string) => void;
}) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createDeviceToken,
    isError,
    error,
  } = useMutation({
    mutationKey: [MutationKeys.CREATE_DEVICE_TOKEN],
    mutationFn: async (data: CreateDeviceTokenFormValues) => {
      const req = await api['device-tokens'].$post({ json: data });
      if (!req.ok) {
        throw new Error(`Failed to create device token. Status: ${req.status}`);
      }
      queryClient.invalidateQueries({ queryKey: [QueryKeys.DEVICE_TOKENS] });
      return await req.json();
    },
  });
  const form = useForm<CreateDeviceTokenFormValues>({
    resolver: zodResolver(createDeviceTokenSchema),
    mode: 'onChange',
    defaultValues: defaultCreateDeviceTokenFormValues,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const newToken = await createDeviceToken(data);
    setOpenedDeviceToken(newToken.token);
    closeDialog();
  });

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={onSubmit} autoComplete="off">
        <DialogHeader>
          <DialogTitle>Create a device token</DialogTitle>
          <DialogDescription>
            A device token is a token that connects a device to your account.
          </DialogDescription>
        </DialogHeader>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device token name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={`"Living room TV", "Joe's iPhone", etc...`}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isError && (
          <Alert
            variant="error"
            title="Failed to create device token"
            description={error.message}
          />
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button" className="min-w-32">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={form.formState.isSubmitting || !form.formState.isValid}
            className="flex items-center justify-center min-w-32 space-x-2"
          >
            {form.formState.isSubmitting && <LoadingSpinner className="size-3" />}
            Create
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const CreateDeviceToken = ({
  setOpenedDeviceToken,
}: {
  setOpenedDeviceToken: (token: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="flex items-center">
          <PlusIcon className="size-4" />
          <span>Create device token</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateDeviceTokenForm
          closeDialog={() => setIsOpen(false)}
          setOpenedDeviceToken={setOpenedDeviceToken}
        />
      </DialogContent>
    </Dialog>
  );
};

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';

import { NonAdminUsers } from './non-admin-users';
import { defaultSetupFormValues } from '../constants';
import { UserFields } from './user-fields';
import { toast } from 'sonner';

import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys } from '@/constants/mutation-keys';
import { api } from '@/api';
import { QueryKeys } from '@/constants/query-keys';
import { handleError, HttpError } from '@/lib/errors';
import { CreateConfigRequest, createConfigSchema } from '@server/schemas/config.schema';
import { SettingsFormFields } from '@/components/settings/settings-form-fields';

export const SetupForm = ({ localUrl }: { localUrl: string | undefined }) => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (data: CreateConfigRequest) => {
      const req = await api.config.$post({ json: data });
      if (!req.ok) {
        throw new HttpError(req);
      }
      return await req.json();
    },
    mutationKey: [MutationKeys.CREATE_SETUP],
    onError: (e) => handleError(e, 'An error occurred while setting up the addon'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CONFIG] });
      toast.success('Addon setup successful', { duration: 5000 });
    },
  });

  const form = useForm<CreateConfigRequest>({
    resolver: zodResolver(createConfigSchema),
    mode: 'onChange',
    defaultValues: defaultSetupFormValues,
    shouldUnregister: false,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Installation Wizard</CardTitle>
            <CardDescription>Configure your addon installation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-12">
            <SettingsFormFields localUrl={localUrl} />
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin login credentials</h3>
              <p className="text-sm text-muted-foreground">
                Create an admin user for yourself. There can only be one admin user.
                Admins can manage the users and torrents in the addon.
              </p>
              <UserFields baseName="admin" />
            </div>

            <Separator />

            <NonAdminUsers />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Submit
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

import { useAppForm } from '@client/components/form';
import { AddonSettingsFields } from '@client/components/form/field-groups/addon-settings-fields';
import { CreateUserFields } from '@client/components/form/field-groups/create-user-fields';
import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { isConfiguredQueryOptions } from '@client/integrations/tanstack-query/queries/config';
import { handleHttpError } from '@client/utils/http';
import { addToast, Card, Form } from '@heroui/react';
import {
  createConfigSchema,
  Language,
  Resolution,
  type CreateConfigRequest,
} from '@server/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useLayoutEffect, useRef } from 'react';

export const Route = createFileRoute('/setup')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const isConfigured = await context.queryClient.ensureQueryData(
      isConfiguredQueryOptions,
    );
    if (isConfigured) {
      throw redirect({ to: '/login' });
    }
  },
});

function getLocalIpDefaultValue() {
  const urlHostname = window.location.hostname;
  const isCurrentUrlIpv4Address = urlHostname.match(/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/);
  return isCurrentUrlIpv4Address ? urlHostname : '';
}

function RouteComponent() {
  const router = useRouter();

  const firstFieldRef = useRef<HTMLInputElement>(null);

  const { mutateAsync } = useMutation({
    mutationFn: async (values: CreateConfigRequest) => {
      const response = await apiClient.api.config.$post(
        { json: values },
        { init: { signal: AbortSignal.timeout(6_000) } },
      );
      if (!response.ok) {
        await handleHttpError(response);
      }
    },
  });

  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const form = useAppForm({
    validators: {
      onChange: createConfigSchema,
    },
    defaultValues: {
      localIp: getLocalIpDefaultValue(),
      remoteUrl: '',
      deleteAfterHitnrun: {
        enabled: true,
        cron: '0 2 * * *',
      },
      admin: {
        username: '',
        password: '',
        preferredLanguage: undefined as unknown as Language,
        preferredResolutions: [] as Resolution[],
      },
    },
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value);
        addToast({
          title: 'Setup complete',
          description: 'You can now log in with your admin account.',
          color: 'success',
          timeout: 5000,
        });
        await queryClient.refetchQueries(isConfiguredQueryOptions);
        await router.invalidate();
      } catch (error) {
        addToast({
          title: 'Setup failed',
          description: (error as Error)?.message,
          color: 'danger',
          timeout: 5000,
        });
        firstFieldRef.current?.focus();
      }
    },
  });

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="max-w-2xl w-full flex flex-col gap-4">
        <Text as="h1" variant="heading-lg">
          Setup <span>🛠️</span>
        </Text>
        <form.AppForm>
          <Form
            className="flex flex-col gap-6 py-4"
            validationBehavior="native"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <div className="grid gap-4 w-full">
              <Text as="h2" variant="heading-sm">
                Addon settings
              </Text>
              <AddonSettingsFields
                form={form}
                fields={{
                  localIp: 'localIp',
                  remoteUrl: 'remoteUrl',
                  deleteAfterHitnrun: 'deleteAfterHitnrun',
                }}
              />
            </div>

            <Card className="grid gap-4 w-full p-6">
              <Text as="h2" variant="heading-sm">
                Admin account
              </Text>
              <CreateUserFields
                form={form}
                fields={{
                  username: 'admin.username',
                  password: 'admin.password',
                  preferredLanguage: 'admin.preferredLanguage',
                  preferredResolutions: 'admin.preferredResolutions',
                }}
              />
            </Card>

            <form.SubmitButton color="primary" className="w-full">
              Complete setup
            </form.SubmitButton>
          </Form>
        </form.AppForm>
      </div>
    </div>
  );
}

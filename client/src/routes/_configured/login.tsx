import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { loginSchema, type LoginCredentials } from '@sna/server';
import { addToast, Button, Form, Input } from '@heroui/react';
import { useLayoutEffect, useRef } from 'react';
import { meOrNullQueryOptions } from '@/integrations/tanstack-query/queries/me';
import { Text } from '@/components/text';
import { apiClient } from '@/integrations/api';
import { handleHttpError } from '@/utils/http';

export const Route = createFileRoute('/_configured/login')({
  loader: ({ context }) => context.queryClient.ensureQueryData(meOrNullQueryOptions),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { data: me } = useSuspenseQuery(meOrNullQueryOptions);
  if (me) {
    router.navigate({ to: '/account' });
  }
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { mutateAsync } = useMutation({
    mutationFn: async (values: LoginCredentials) => {
      const response = await apiClient.api.login.$post(
        { json: values },
        { init: { signal: AbortSignal.timeout(1_000) } }, // 6 second timeout
      );
      if (!response.ok) {
        await handleHttpError(response);
      }
      return;
    },
  });

  useLayoutEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const form = useForm({
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ formApi, value }) => {
      try {
        await mutateAsync(value);
        addToast({
          title: 'Login successful',
          color: 'success',
          timeout: 3000,
        });
        await router.invalidate();
        await router.navigate({ to: '/account' });
      } catch (error) {
        addToast({
          title: 'Login failed',
          description: (error as Error)?.message,
          color: 'danger',
          timeout: 5000,
        });
        formApi.reset();
        firstFieldRef.current?.focus();
      }
    },
    defaultValues: {
      username: '',
      password: '',
    },
  });

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="max-w-sm w-full flex flex-col gap-4">
        <Text as="h1" variant="heading-lg">
          Log in <span>👋</span>
          <Form
            className="flex flex-col gap-4 py-4"
            validationBehavior="native"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field name="username">
              {(field) => (
                <Input
                  isRequired
                  label="Username"
                  labelPlacement="outside-top"
                  variant="bordered"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  ref={firstFieldRef}
                  autoComplete="username"
                />
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <Input
                  isRequired
                  type="password"
                  label="Password"
                  labelPlacement="outside-top"
                  variant="bordered"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="password"
                />
              )}
            </form.Field>

            <form.Subscribe>
              {(state) => {
                return (
                  <Button
                    type="submit"
                    isDisabled={!state.canSubmit}
                    color="primary"
                    className="w-full"
                  >
                    Log in
                  </Button>
                );
              }}
            </form.Subscribe>
          </Form>
        </Text>
      </div>
    </div>
  );
}

import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginSchema, type LoginCredentials } from '@sna/server';
import { addToast, Form } from '@heroui/react';
import { useLayoutEffect, useRef } from 'react';
import { meOrNullQueryOptions } from '@/integrations/tanstack-query/queries/me';
import { Text } from '@/components/text';
import { apiClient } from '@/integrations/api';
import { handleHttpError } from '@/utils/http';
import { useAppForm } from '@/components/form';

export const Route = createFileRoute('/_configured/login')({
  loader: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meOrNullQueryOptions);
    if (me) {
      throw redirect({ to: '/account' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { mutateAsync } = useMutation({
    mutationFn: async (values: LoginCredentials) => {
      const response = await apiClient.api.login.$post(
        { json: values },
        { init: { signal: AbortSignal.timeout(6_000) } }, // 6 second timeout
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
        await queryClient.refetchQueries(meOrNullQueryOptions);
        await router.invalidate();
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
          <form.AppForm>
            <Form
              className="flex flex-col gap-4 py-4"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.AppField name="username">
                {(field) => (
                  <field.TextField
                    isRequired
                    label="Username"
                    labelPlacement="outside-top"
                    variant="bordered"
                    ref={firstFieldRef}
                    autoComplete="username"
                  />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    isRequired
                    type="password"
                    label="Password"
                    labelPlacement="outside-top"
                    variant="bordered"
                    autoComplete="password"
                  />
                )}
              </form.AppField>

              <form.SubmitButton color="primary" className="w-full">
                Log in
              </form.SubmitButton>
            </Form>
          </form.AppForm>
        </Text>
      </div>
    </div>
  );
}

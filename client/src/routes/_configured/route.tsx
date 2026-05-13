import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { isConfiguredQueryOptions } from '@/integrations/tanstack-query/queries/config';

export const Route = createFileRoute('/_configured')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const isConfigured = await context.queryClient.ensureQueryData(
      isConfiguredQueryOptions,
    );
    if (!isConfigured) {
      throw redirect({ to: '/setup' });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}

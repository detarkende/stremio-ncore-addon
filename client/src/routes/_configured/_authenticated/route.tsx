import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Layout } from '@/components/layout';
import { LoaderScreen } from '@/components/loader-screen';
import { meOrNullQueryOptions } from '@/integrations/tanstack-query/queries/me';

export const Route = createFileRoute('/_configured/_authenticated')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meOrNullQueryOptions);
    if (!me) {
      throw redirect({ to: '/login' });
    }
    return { me };
  },
  pendingComponent: LoaderScreen,
});

function RouteComponent() {
  const { me } = Route.useRouteContext();
  return (
    <Layout userRole={me.role}>
      <Outlet />
    </Layout>
  );
}

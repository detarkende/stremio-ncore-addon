import { Layout } from '@client/components/layout';
import { LoaderScreen } from '@client/components/loader-screen';
import { meOrNullQueryOptions } from '@client/integrations/tanstack-query/queries/me';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

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

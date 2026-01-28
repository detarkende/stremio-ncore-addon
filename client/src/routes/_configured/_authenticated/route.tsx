import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Layout } from '@/components/layout';
import { meQueryOptions } from '@/integrations/tanstack-query/queries/me';
import { LoaderScreen } from '@/components/loader-screen';

export const Route = createFileRoute('/_configured/_authenticated')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions);
    if (!me) {
      throw redirect({ to: '/login' });
    }
    return { me };
  },
  pendingComponent: LoaderScreen,
});

function RouteComponent() {
  const { me } = Route.useLoaderData();
  return (
    <Layout userRole={me.role}>
      <Outlet />
    </Layout>
  );
}

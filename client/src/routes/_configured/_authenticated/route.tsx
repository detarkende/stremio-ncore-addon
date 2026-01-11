import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Layout } from '@/components/layout';
import { meQueryOptions } from '@/integrations/tanstack-query/queries/me';
import { LoaderScreen } from '@/components/loader-screen';

export const Route = createFileRoute('/_configured/_authenticated')({
  component: RouteComponent,
  loader: ({ context }) => context.queryClient.ensureQueryData(meQueryOptions),
  pendingComponent: LoaderScreen,
});

function RouteComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

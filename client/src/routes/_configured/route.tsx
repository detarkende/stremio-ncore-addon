import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { isConfiguredQueryOptions } from '@/integrations/tanstack-query/queries/config';

export const Route = createFileRoute('/_configured')({
  component: RouteComponent,
  loader: ({ context }) => context.queryClient.ensureQueryData(isConfiguredQueryOptions),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: isConfigured } = useSuspenseQuery(isConfiguredQueryOptions);
  if (!isConfigured) {
    navigate({ to: '/setup' });
    return null;
  }
  return <Outlet />;
}

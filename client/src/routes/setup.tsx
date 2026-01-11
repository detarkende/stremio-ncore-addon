import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { isConfiguredQueryOptions } from '@/integrations/tanstack-query/queries/config';

export const Route = createFileRoute('/setup')({
  component: RouteComponent,
  loader: ({ context }) => context.queryClient.ensureQueryData(isConfiguredQueryOptions),
});

function RouteComponent() {
  const { data: isConfigured } = useSuspenseQuery(isConfiguredQueryOptions);
  const router = useRouter();
  if (isConfigured) {
    router.navigate({ to: '/login' });
    return null;
  }
  return <div>Hello setup</div>;
}

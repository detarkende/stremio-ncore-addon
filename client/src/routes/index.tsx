import { createFileRoute, redirect } from '@tanstack/react-router';
import { isConfiguredQueryOptions } from '@/integrations/tanstack-query/queries/config';

export const Route = createFileRoute('/')({
  component: App,
  loader: async ({ context }) => {
    const isConfigured = await context.queryClient.ensureQueryData(
      isConfiguredQueryOptions,
    );
    if (isConfigured) {
      throw redirect({ to: '/login' });
    } else {
      throw redirect({ to: '/setup' });
    }
  },
});

function App() {
  return null;
}

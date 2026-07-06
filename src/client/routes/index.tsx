import { isConfiguredQueryOptions } from '@client/integrations/tanstack-query/queries/config';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: async ({ context }) => {
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

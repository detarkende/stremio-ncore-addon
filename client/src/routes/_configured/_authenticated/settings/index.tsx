import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { UserRole } from '@sna/server';
import { ConfigSettings } from './-components/config-settings';
import { Users } from './-components/users';
import { MyAccount } from './-components/my-account';
import { meQueryOptions } from '@/integrations/tanstack-query/queries/me';

export const Route = createFileRoute('/_configured/_authenticated/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const isAdmin = me.role === UserRole.ADMIN;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {isAdmin && <ConfigSettings />}
      {isAdmin ? <Users me={me} /> : <MyAccount me={me} />}
    </div>
  );
}

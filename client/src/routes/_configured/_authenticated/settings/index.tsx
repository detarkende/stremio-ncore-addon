import { UserRole } from '@sna/server';
import { createFileRoute } from '@tanstack/react-router';

import { ConfigSettings } from './-components/config-settings';
import { MyAccount } from './-components/my-account';
import { Users } from './-components/users';

export const Route = createFileRoute('/_configured/_authenticated/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { me } = Route.useRouteContext();
  const isAdmin = me.role === UserRole.ADMIN;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
      {isAdmin ? (
        <>
          <ConfigSettings />
          <Users me={me} />
        </>
      ) : (
        <MyAccount me={me} />
      )}
    </div>
  );
}

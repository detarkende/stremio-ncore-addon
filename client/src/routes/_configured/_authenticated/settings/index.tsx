import { createFileRoute } from '@tanstack/react-router';
import { UserRole } from '@sna/server';
import { ConfigSettings } from './-components/config-settings';
import { Users } from './-components/users';
import { MyAccount } from './-components/my-account';

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

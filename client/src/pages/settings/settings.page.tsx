import { useAutoAnimate } from '@formkit/auto-animate/react';
import { UserRole } from '@server/db/schema/users';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'wouter';
import { PlusIcon } from 'lucide-react';
import { UserCard } from './components/user-card';
import { UpdateAddonSettingsForm } from './components/update-addon-settings-form';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/page-loader';
import { QueryKeys } from '@/constants/query-keys';
import { useMe } from '@/hooks/use-me';
import { api } from '@/api';
import { CreateUserModal } from '@/components/user/create-user/create-user-modal';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/hooks/use-config';

export const SettingsPage = () => {
  const [animatedParent] = useAutoAnimate();
  const { data: me, isLoading: isMeLoading } = useMe();
  const { config, isLoading: isConfigLoading } = useConfig();
  const {
    data: users,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
  } = useQuery({
    queryKey: [QueryKeys.USERS],
    queryFn: async () => {
      const response = await api.users.$get();
      return response.json();
    },
  });

  if (me && me.role !== UserRole.ADMIN) {
    return <Redirect to="/account" />;
  }

  if (isMeLoading || !me || isConfigLoading || !config || isUsersLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold">Settings</h1>
      <section className="space-y-4" aria-describedby="users-section-title">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold" id="users-section-title">
            Users
          </h2>
          <CreateUserModal
            trigger={
              <Button variant="link">
                <PlusIcon className="size-3 mr-1" />
                Add user
              </Button>
            }
          />
        </div>
        {isUsersError && (
          <Alert
            variant="error"
            title="Failed to load users"
            description={usersError.message}
          />
        )}
        <div
          ref={animatedParent}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {users?.map((user) => <UserCard key={user.id} user={user} me={me} />)}
        </div>
      </section>

      <section className="space-y-4" aria-describedby="addon-settings-section-title">
        <h2 className="text-xl font-bold" id="addon-settings-section-title">
          Addon settings
        </h2>
        <div className="space-y-12">
          <UpdateAddonSettingsForm config={config} />
        </div>
      </section>
    </div>
  );
};

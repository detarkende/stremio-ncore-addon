import { api } from '@/api';
import { Alert } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QueryKeys } from '@/constants/query-keys';
import { useMe } from '@/hooks/use-me';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'wouter';
import { UserRow } from './components/user-row';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { CreateUserModal } from '@/components/user/create-user/create-user-modal';
import { UserRole } from '@server/db/schema/users';
import { PageLoader } from '@/components/ui/page-loader';

export const UsersPage = () => {
  const [animatedParent] = useAutoAnimate();
  const { data: me, isLoading: isMeLoading } = useMe();
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

  if (isMeLoading || !me || isUsersLoading) {
    return <PageLoader />;
  }

  if (isUsersError) {
    return (
      <div>
        <Alert
          variant="error"
          title="Failed to load users"
          description={usersError.message}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="overflow-x-auto md:overflow-x-visible w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="text-nowrap">
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Preferred language</TableHead>
              <TableHead>Preferred resolutions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={animatedParent}>
            {users?.map((user) => <UserRow key={user.id} user={user} me={me} />)}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <CreateUserModal
          trigger={
            <Button>
              <PlusIcon />
              Add user
            </Button>
          }
        />
      </div>
    </div>
  );
};

import { TableCell, TableRow } from '@/components/ui/table';
import { UserActions } from '@/components/user';
import { UserRole } from '@server/db/schema/users';
import { User } from '@server/types/user';

export const UserRow = ({ user, me }: { user: User; me: User }) => {
  return (
    <>
      <TableRow>
        <TableCell>{user.username}</TableCell>
        <TableCell>{user.role}</TableCell>
        <TableCell>{user.preferredLanguage}</TableCell>
        <TableCell>{user.preferredResolutions.join(', ')}</TableCell>
        <TableCell>
          {me?.role === UserRole.ADMIN && (
            <UserActions
              user={user}
              isDeleteEnabled={me.id !== user.id && user.role !== UserRole.ADMIN}
            />
          )}
        </TableCell>
      </TableRow>
    </>
  );
};

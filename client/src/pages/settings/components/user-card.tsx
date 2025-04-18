import { UserRole } from '@server/db/schema/users';
import { User } from '@server/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserActions } from '@/components/user';
import { languageLabelLookup } from '@/pages/setup/constants';

export const UserCard = ({ user, me }: { user: User; me: User }) => {
  const isMe = me.id === user.id;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>
            {user.username}{' '}
            {isMe && <span className="text-md font-normal text-neutral-400">(You)</span>}
          </CardTitle>
          <UserActions
            user={user}
            isDeleteEnabled={
              user.role !== UserRole.ADMIN && (isMe || me.role === UserRole.ADMIN)
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        <p>Role: {user.role}</p>
        <p>Preferred language: {languageLabelLookup[user.preferredLanguage]}</p>
        <p>Preferred resolutions: {user.preferredResolutions.join(', ')}</p>
      </CardContent>
    </Card>
  );
};

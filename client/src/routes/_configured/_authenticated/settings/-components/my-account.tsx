import type { User } from '@sna/server';

import { Text } from '@/components/text';

import { UserCard } from './user-card/user-card';

export function MyAccount({ me }: { me: User }) {
  return (
    <div className="flex flex-col gap-4">
      <Text as="h2">My Account</Text>
      <UserCard isMe user={me} />
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { Button, Skeleton } from '@heroui/react';
import type { User } from '@sna/server';
import { UserCard } from './user-card/user-card';
import { CreateNewUser } from './create-new-user';
import { Text } from '@/components/text';
import { usersQueryOptions } from '@/integrations/tanstack-query/queries/users';

function Wrapper({ children }: PropsWithChildren) {
  return (
    <div className="space-y-4">
      <Text as="h2" variant="heading-sm">
        <span>👥</span> Users
      </Text>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function Users({ me }: { me: User }) {
  const query = useQuery(usersQueryOptions);

  if (query.isPending) {
    return (
      <Wrapper>
        {Array.from({ length: 1 }).map((_, index) => (
          <Skeleton key={index} className="rounded-xl h-18" />
        ))}
      </Wrapper>
    );
  }

  if (query.error) {
    return (
      <Wrapper>
        <div className="bg-danger-50/50 rounded-xl flex flex-col items-center justify-center gap-4 w-full h-96">
          <Text as="p" variant="body-lg" className="text-danger-500">
            Failed to load users.
          </Text>
          {query.error && (
            <Text variant="body-sm" as="pre" className="mt-2 text-danger-500">
              {(query.error as Error).message}
            </Text>
          )}
          <Button color="danger" variant="flat" onPress={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {query.data.map((user) => (
        <UserCard key={user.id} user={user} isMe={user.id === me.id} />
      ))}
      <CreateNewUser />
    </Wrapper>
  );
}

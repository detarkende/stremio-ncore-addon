import { Text } from '@client/components/text';
import { torrentsQueryOptions } from '@client/integrations/tanstack-query/queries/torrents';
import { Button, Spinner } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import { TorrentCard } from './-components/torrent-card';

export const Route = createFileRoute('/_configured/_authenticated/torrents/')({
  component: RouteComponent,
});

function Wrapper({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col gap-6">
      <Text as="h1" variant="heading-lg">
        Torrents
      </Text>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function RouteComponent() {
  const query = useQuery({ ...torrentsQueryOptions, refetchInterval: 1000 * 5 });

  if (query.isPending) {
    return (
      <Wrapper>
        <div className="bg-default-200 rounded-xl flex items-center justify-center w-full h-58">
          <Spinner size="lg" />
        </div>
      </Wrapper>
    );
  }

  if (query.isError) {
    return (
      <Wrapper>
        <div className="bg-danger-50/50 rounded-xl flex flex-col items-center justify-center gap-4 w-full h-58">
          <Text as="p" variant="body-lg" className="text-danger-500">
            Failed to load torrents.
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

  const torrents = query.data;

  return (
    <Wrapper>
      <Text as="p">
        Last updated at: {new Date(query.dataUpdatedAt).toLocaleTimeString()}
      </Text>
      {torrents.length === 0 ? (
        <Text as="p">No torrents found.</Text>
      ) : (
        torrents.map((torrent) => (
          <TorrentCard key={torrent.infoHash} torrent={torrent} />
        ))
      )}
    </Wrapper>
  );
}

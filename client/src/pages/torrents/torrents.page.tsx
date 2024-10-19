import { api } from '@/api';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMe } from '@/hooks/use-me';
import { useJwtStore } from '@/stores/jwt';
import { useQuery } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { Redirect } from 'wouter';
import { DeleteTorrentButton } from './components/delete-torrent-button';
import { TORRENTS_QUERY_KEY } from './constants';

const Container = ({ children }: PropsWithChildren) => (
  <div className="container pt-6 pb-24 min-h-full">
    <div className="h-full flex flex-col items-center justify-center space-y-8">
      <h1 className="text-2xl font-semibold">Torrents</h1>
      {children}
    </div>
  </div>
);

export const TorrentsPage = () => {
  const { jwt } = useJwtStore();
  const { data: user } = useMe(jwt);
  const {
    data: torrents,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [TORRENTS_QUERY_KEY],
    queryFn: async () => {
      const req = await api.api.auth[':jwt'].torrents.$get({ param: { jwt: jwt ?? '' } });
      return await req.json();
    },
    enabled: !!jwt && !!user && user.role === 'admin',
    refetchInterval: 10_000,
  });

  const [animatedParent] = useAutoAnimate();

  if (user && user.role !== 'admin') {
    return <Redirect to="/account" />;
  }

  if (isError) {
    return (
      <Container>
        <Alert
          variant="error"
          title="An error occured while loading your torrents"
          description={error.message}
        />
      </Container>
    );
  }

  if (isLoading || !torrents) {
    return (
      <Container>
        <Skeleton />
      </Container>
    );
  }

  return (
    <Container>
      <div className="overflow-x-auto md:overflow-x-visible w-full">
        <Table className="w-full">
          <TableCaption>Your currently active torrents</TableCaption>
          <TableHeader>
            <TableRow className="text-nowrap">
              <TableHead>
                <span>Release name</span>
              </TableHead>
              <TableHead>Downloaded</TableHead>
              <TableHead>Total size</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={animatedParent}>
            {torrents.map((torrent) => (
              <TableRow key={torrent.hash}>
                <TableCell>
                  <span className="break-all line-clamp-3 overflow-hidden overflow-ellipsis">
                    {torrent.name}
                  </span>
                </TableCell>
                <TableCell>{torrent.downloaded}</TableCell>
                <TableCell>{torrent.size}</TableCell>
                <TableCell>{torrent.progress}</TableCell>
                <TableCell>{jwt && <DeleteTorrentButton torrent={torrent} jwt={jwt} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Container>
  );
};

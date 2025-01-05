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
import { useQuery } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { Redirect } from 'wouter';
import { DeleteTorrentButton } from './components/delete-torrent-button';
import { TORRENTS_QUERY_KEY } from './constants';
import { UserRole } from '@server/db/schema/users';

const Container = ({ children }: PropsWithChildren) => (
  <div className="h-full pt-6 pb-24 flex flex-col space-y-8">
    <h1 className="text-2xl font-semibold text-center">Torrents</h1>
    {children}
  </div>
);

export const TorrentsPage = () => {
  const { data: user } = useMe();
  const {
    data: torrents,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [TORRENTS_QUERY_KEY],
    queryFn: async () => {
      const req = await api.torrents.$get();
      return await req.json();
    },
    enabled: !!user && user.role === UserRole.ADMIN,
    refetchInterval: 10_000,
  });

  const [animatedParent] = useAutoAnimate();

  if (user && user.role !== UserRole.ADMIN) {
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
                <TableCell>
                  {user?.role === UserRole.ADMIN && (
                    <DeleteTorrentButton torrent={torrent} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Container>
  );
};

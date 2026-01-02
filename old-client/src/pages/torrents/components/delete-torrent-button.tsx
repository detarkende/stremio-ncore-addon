import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TORRENTS_QUERY_KEY } from '../constants';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';

export const DeleteTorrentButton = ({
  torrent,
}: {
  torrent: Awaited<
    ReturnType<Awaited<ReturnType<typeof api.torrents.$get>>['json']>
  >[number];
}) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteTorrent, isPending } = useMutation({
    mutationFn: async () => {
      await api.torrents[':infoHash'].$delete({
        param: { infoHash: torrent.infoHash },
      });
    },
  });

  const handleClick = async () => {
    const confirm = window.confirm(
      `Are you sure you want to delete this torrent?\n${torrent.name}`,
    );
    if (confirm) {
      await deleteTorrent();
    }
    queryClient.invalidateQueries({ queryKey: [TORRENTS_QUERY_KEY] });
  };

  return (
    <>
      {isPending && <FullScreenLoader />}
      <Button variant="destructive" size="sm" onClick={handleClick}>
        Delete
      </Button>
    </>
  );
};

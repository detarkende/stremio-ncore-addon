import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { addToast, Button, Card, Progress } from '@heroui/react';
import { formatBytes, type Torrent } from '@server/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { TorrentFile } from './torrent-file';

export function TorrentCard({ torrent }: { torrent: Torrent }) {
  const labelId = `torrent-progress-${torrent.infoHash}`;
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.torrents[':infoHash'].$delete({
        param: { infoHash: torrent.infoHash },
      });
      if (!response.ok) {
        await handleHttpError(response);
      }
    },
  });

  const handleDelete = async () => {
    if (!window.confirm(`Delete torrent "${torrent.name}"?`)) {
      return;
    }
    try {
      await mutateAsync();
      await queryClient.refetchQueries({ queryKey: [QueryKeys.TORRENTS] });
      addToast({
        title: 'Torrent deleted',
        description: `"${torrent.name}" has been deleted successfully.`,
        color: 'success',
        timeout: 5000,
      });
    } catch (error) {
      addToast({
        title: `Failed to delete "${torrent.name}"`,
        description: (error as Error).message,
        color: 'danger',
        timeout: 10_000,
      });
    }
  };

  return (
    <Card as="article" className="p-5 flex flex-col gap-4" aria-labelledby={labelId}>
      <div className="flex flex-col gap-2">
        <Text as="h2" id={labelId} className="break-all">
          {torrent.name}
        </Text>
        <Text as="p" variant="body-sm" className="text-default-500">
          Downloaded: {formatBytes(torrent.downloaded)} / {formatBytes(torrent.size)}
        </Text>
        <Progress
          className="max-w-xl text-default-500"
          value={torrent.progress * 100}
          showValueLabel
          color={torrent.progress === 1 ? 'success' : 'primary'}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Text
          as="button"
          variant="body-md"
          className="text-default-500 hover:underline cursor-pointer"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={`torrent-files-${torrent.infoHash}`}
        >
          Files ({torrent.files.length}){isOpen ? ' ▲' : ' ▼'}
        </Text>
        <Button
          size="sm"
          color="danger"
          variant="flat"
          onPress={handleDelete}
          isLoading={isPending}
        >
          Delete
        </Button>
      </div>

      {isOpen && (
        <div
          id={`torrent-files-${torrent.infoHash}`}
          className="max-w-xl rounded-lg border border-default-200 bg-default-50/40 p-3 flex flex-col gap-2"
        >
          {torrent.files.map((file) => (
            <TorrentFile key={file.path} torrent={torrent} file={file} />
          ))}
        </div>
      )}
    </Card>
  );
}

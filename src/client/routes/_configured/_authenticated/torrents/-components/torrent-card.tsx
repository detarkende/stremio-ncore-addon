import { Text } from '@client/components/text';
import { apiClient } from '@client/integrations/api';
import { QueryKeys } from '@client/integrations/tanstack-query/keys';
import { handleHttpError } from '@client/utils/http';
import { Button, Card, Chip, Label, ProgressBar, toast } from '@heroui/react';
import { formatBytes, type Torrent } from '@server/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { TorrentFile } from './torrent-file';

export function TorrentCard({
  torrent,
  isUnnecessary = false,
}: {
  torrent: Torrent;
  isUnnecessary?: boolean;
}) {
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
      toast.success('Torrent deleted', {
        description: `"${torrent.name}" has been deleted successfully.`,
        timeout: 5000,
      });
    } catch (error) {
      toast.danger(`Failed to delete "${torrent.name}"`, {
        description: (error as Error).message,
        timeout: 10_000,
      });
    }
  };

  const downloadedLabelId = `downloaded-label-${torrent.infoHash}`;

  const card = (
    <Card className="p-5 flex flex-col gap-4" role="article" aria-labelledby={labelId}>
      <div className="flex flex-col gap-2">
        <Text as="h2" id={labelId} className="break-all">
          {torrent.name}
        </Text>
        <Text as="p" id={downloadedLabelId} variant="body-sm" className="text-muted">
          Downloaded: {formatBytes(torrent.downloaded)} / {formatBytes(torrent.size)}
        </Text>
        <ProgressBar
          aria-labelledby={downloadedLabelId}
          className="max-w-xl text-muted"
          value={torrent.progress * 100}
          color={torrent.progress === 1 ? 'success' : 'accent'}
        >
          <Label className="sr-only">Download progress</Label>
          <ProgressBar.Output />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Text
          as="button"
          variant="body-md"
          className="text-muted hover:underline cursor-pointer"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={`torrent-files-${torrent.infoHash}`}
        >
          Files ({torrent.files.length}){isOpen ? ' ▲' : ' ▼'}
        </Text>
        <div className="flex items-center gap-2">
          {isUnnecessary && (
            <Chip size="sm" color="warning" variant="soft">
              Unnecessary
            </Chip>
          )}
          <Button
            size="sm"
            variant="danger-soft"
            onPress={handleDelete}
            isPending={isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      {isOpen && (
        <div
          id={`torrent-files-${torrent.infoHash}`}
          className="max-w-xl rounded-lg border border-border bg-surface/40 p-3 flex flex-col gap-2"
        >
          {torrent.files.map((file) => (
            <TorrentFile key={file.path} torrent={torrent} file={file} />
          ))}
        </div>
      )}
    </Card>
  );

  return card;
}

import { Text } from '@client/components/text';
import { Label, ProgressBar } from '@heroui/react';
import type { Torrent, TorrentFile } from '@server/exports';

export function TorrentFile({ torrent, file }: { torrent: Torrent; file: TorrentFile }) {
  const labelId = `torrent-file-${torrent.infoHash}-${file.path}`;

  return (
    <div aria-labelledby={labelId} className="flex flex-col gap-1">
      <Text as="div" id={labelId} className="text-sm break-all">
        {file.name}
      </Text>
      <ProgressBar
        value={file.progress * 100}
        size="sm"
        color={file.progress === 1 ? 'success' : 'accent'}
      >
        <Label className="sr-only">File progress</Label>
        <ProgressBar.Output />
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}

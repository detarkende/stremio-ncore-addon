import type { Torrent, TorrentFile } from '@sna/server';
import { Progress } from '@heroui/react';
import { Text } from '@/components/text';

export function TorrentFile({ torrent, file }: { torrent: Torrent; file: TorrentFile }) {
  const labelId = `torrent-file-${torrent.infoHash}-${file.path}`;

  return (
    <div aria-labelledby={labelId} className="flex flex-col gap-1">
      <Text as="div" id={labelId} className="text-sm break-all">
        {file.name}
      </Text>
      <Progress
        value={file.progress * 100}
        size="sm"
        showValueLabel
        color={file.progress === 1 ? 'success' : 'primary'}
      />
    </div>
  );
}

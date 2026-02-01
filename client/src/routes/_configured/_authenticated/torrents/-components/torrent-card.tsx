import { Card, Progress } from '@heroui/react';
import { formatBytes, type Torrent } from '@sna/server';
import { TorrentFile } from './torrent-file';
import { Text } from '@/components/text';

export function TorrentCard({ torrent }: { torrent: Torrent }) {
  const labelId = `torrent-progress-${torrent.infoHash}`;
  return (
    <Card as="article" className="p-4 flex flex-col gap-4" aria-labelledby={labelId}>
      <div className="flex flex-col gap-2">
        <Text as="h2" id={labelId}>
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

      <div>
        <Text as="h3" variant="body-md" className="text-default-500">
          Files
        </Text>
        <div>
          {torrent.files.map((file) => (
            <TorrentFile key={file.path} torrent={torrent} file={file} />
          ))}
        </div>
      </div>
    </Card>
  );
}

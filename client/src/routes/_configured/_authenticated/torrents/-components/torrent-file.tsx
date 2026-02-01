import type { Torrent, TorrentFile } from '@sna/server';
import { Text } from '@/components/text';

export function TorrentFile({ torrent, file }: { torrent: Torrent; file: TorrentFile }) {
  const labelId = `torrent-file-${torrent.infoHash}-${file.path}`;

  return (
    <div aria-labelledby={labelId}>
      <Text as="div" id={labelId}>
        {file.path}
      </Text>
    </div>
  );
}

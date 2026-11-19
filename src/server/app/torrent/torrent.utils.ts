import type {
  ParsedTorrentFileDetails,
  TorrentFile,
} from '@server/app/torrent/torrent.types';
import { db } from '@server/db';

import { ncoreService } from '../ncore';
import type { StreamType } from '../stream/stream.constants';
import { downloadAndParseTorrent } from './torrent-file.utils';
import { insertUserTorrentFileRecord } from './torrent.db.utils';
import { torrentStore } from './torrent.store';
import type { Torrent } from './torrent.types';

export async function getOrAddTorrent({
  userId,
  imdbId,
  type,
  torrentSourceId,
  infoHash,
}: {
  userId: number;
  imdbId: string;
  type: StreamType;
  torrentSourceId: string;
  infoHash: string;
}): Promise<Torrent> {
  const existingTorrent = await torrentStore.getTorrent(infoHash);
  if (existingTorrent) {
    insertUserTorrentFileRecord(db, {
      userId,
      infoHash,
    });
    return existingTorrent;
  }

  return torrentStore.addTorrent({
    userId,
    imdbId,
    type,
    torrentSourceId,
    infoHash,
  });
}

export async function getTorrentFileSizes({
  infoHash,
  torrentSourceId,
}: {
  infoHash: string;
  torrentSourceId: string;
}): Promise<Record<string, number>> {
  const existingTorrent = await torrentStore.getTorrent(infoHash);
  let torrentFiles: (ParsedTorrentFileDetails | TorrentFile)[] = [];
  if (existingTorrent) {
    torrentFiles = existingTorrent.files;
  } else {
    const ncoreUrl = await ncoreService.getTorrentUrlByNcoreId(torrentSourceId);
    const { torrentFileData } = await downloadAndParseTorrent(ncoreUrl);
    torrentFiles = torrentFileData.files;
  }
  return Object.fromEntries(
    torrentFiles.map((file) => [file.path, 'length' in file ? file.length : file.size]),
  );
}

import type {
  DbTorrent,
  ParsedTorrentFileDetails,
  TorrentFile,
} from '@server/app/torrent/torrent.types';
import type { Db, DbTransaction } from '@server/db';
import { db } from '@server/db';
import { usersTorrentsTable, torrentsTable } from '@server/db/schema';
import { sql } from 'drizzle-orm';

import { ncoreService } from '../ncore';
import type { StreamType } from '../stream/stream.constants';
import { downloadAndParseTorrent } from './torrent-file.utils';
import { torrentStore } from './torrent.store';
import type { ParsedTorrentDetails, Torrent } from './torrent.types';

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

export function insertNewTorrent({
  userId,
  imdbId,
  type,
  torrentBuffer,
  torrentFileData,
}: {
  torrentFileData: ParsedTorrentDetails;
  torrentBuffer: Buffer;
  type: StreamType;
  imdbId: string;
  userId: number;
}): DbTorrent {
  return db.transaction((tx) => {
    const insertedTorrent = tx
      .insert(torrentsTable)
      .values({
        infoHash: torrentFileData.infoHash,
        name: torrentFileData.name,
        imdbId,
        torrentFile: torrentBuffer,
        bitfield: new Uint8Array(),
        type,
      })
      .returning()
      .get();
    insertUserTorrentFileRecord(tx, {
      userId,
      infoHash: insertedTorrent.infoHash,
    });
    return insertedTorrent;
  });
}

export function insertUserTorrentFileRecord(
  tx: Db | DbTransaction,
  {
    userId,
    infoHash,
  }: {
    userId: number;
    infoHash: string;
  },
) {
  return tx
    .insert(usersTorrentsTable)
    .values({
      userId,
      torrentInfoHash: infoHash,
    })
    .onConflictDoUpdate({
      target: [usersTorrentsTable.userId, usersTorrentsTable.torrentInfoHash],
      set: {
        updatedAt: sql`(unixepoch('subsec') * 1000)`,
      },
    })
    .returning()
    .get();
}

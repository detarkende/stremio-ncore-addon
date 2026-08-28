import type { DbTorrent } from '@server/app/torrent/torrent.types';
import { db } from '@server/db';
import { usersTorrentsTable, torrentsTable } from '@server/db/schema';
import { eq } from 'drizzle-orm';

import type { StreamType } from '../stream/stream.constants';
import type { ParsedTorrentDetails } from './torrent.types';

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
    tx.insert(usersTorrentsTable)
      .values({
        userId,
        torrentInfoHash: insertedTorrent.infoHash,
      })
      .returning()
      .get();
    return insertedTorrent;
  });
}

export function insertUserTorrentFileRecord({
  userId,
  torrentInfoHash,
}: {
  userId: number;
  torrentInfoHash: string;
}): void {
  const existingUserTorrentRecord = db
    .select()
    .from(usersTorrentsTable)
    .where(eq(usersTorrentsTable.userId, userId))
    .limit(1)
    .get();
  if (!existingUserTorrentRecord) {
    db.insert(usersTorrentsTable)
      .values({
        userId,
        torrentInfoHash,
      })
      .run();
  }
}

import type { Db, DbTransaction } from '@server/db';
import { db } from '@server/db';
import { torrentsTable, usersTorrentsTable } from '@server/db/schema';
import { sql } from 'drizzle-orm';

import type { StreamType } from '../stream/stream.constants';
import type { DbTorrent, ParsedTorrentDetails } from './torrent.types';

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

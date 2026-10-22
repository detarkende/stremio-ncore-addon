import type { DbTorrent } from '@server/app/torrent/torrent.types';
import { db } from '@server/db';
import { usersTorrentsTable, torrentsTable } from '@server/db/schema';
import { eq } from 'drizzle-orm';

import { ncoreService } from '../ncore';
import type { StreamType } from '../stream/stream.constants';
import { downloadAndParseTorrent } from './torrent-file.utils';
import { torrentClient } from './torrent.client';
import type { ParsedTorrentDetails, Torrent } from './torrent.types';

const pendingTorrentInitializations = new Map<string, Promise<Torrent>>();

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
  const existingTorrent = await torrentClient.getTorrent(infoHash);
  if (existingTorrent) {
    return existingTorrent;
  }

  const pendingInitialization = pendingTorrentInitializations.get(infoHash);
  if (pendingInitialization) {
    return pendingInitialization;
  }

  const initialization = (async () => {
    const ncoreUrl = await ncoreService.getTorrentUrlByNcoreId(torrentSourceId);
    const { torrentFileData, torrentBuffer } = await downloadAndParseTorrent(ncoreUrl);
    const dbTorrent = insertNewTorrent({
      userId,
      imdbId,
      torrentFileData,
      torrentBuffer,
      type,
    });
    return torrentClient.addTorrent(dbTorrent, true);
  })();

  pendingTorrentInitializations.set(infoHash, initialization);
  try {
    return await initialization;
  } finally {
    if (pendingTorrentInitializations.get(infoHash) === initialization) {
      pendingTorrentInitializations.delete(infoHash);
    }
  }
}

export async function getFileForHead({
  infoHash,
  torrentSourceId,
  filePath,
}: {
  infoHash: string;
  torrentSourceId: string;
  filePath: string;
}): Promise<{ path: string; size: number; torrentName: string } | null> {
  const existingTorrent = await torrentClient.getTorrent(infoHash);
  if (existingTorrent) {
    const file = existingTorrent.files.find(
      (torrentFile) => torrentFile.path === filePath,
    );
    return file
      ? { path: file.path, size: file.size, torrentName: existingTorrent.name }
      : null;
  }

  const ncoreUrl = await ncoreService.getTorrentUrlByNcoreId(torrentSourceId);
  const { torrentFileData } = await downloadAndParseTorrent(ncoreUrl);
  const file = torrentFileData.files.find((torrentFile) => torrentFile.path === filePath);
  return file
    ? { path: file.path, size: file.length, torrentName: torrentFileData.name }
    : null;
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

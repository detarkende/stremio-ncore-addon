import parseTorrent from 'parse-torrent';
import { db } from 'src/db';
import type { DbTorrent } from 'src/db/schema/torrents';
import { torrentsTable } from 'src/db/schema/torrents';
import { logger } from 'src/logger';
import { cacheFunction, DEFAULT_TTL } from 'src/utils/cache';

import type { ParsedTorrentDetails } from './torrent.types';

export async function _fetchTorrent(
  torrentUrl: string,
): Promise<{ torrentBuffer: Buffer }> {
  try {
    const response = await fetch(torrentUrl, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch torrent from URL ${torrentUrl}. Status: ${response.status}`,
      );
    }
    return { torrentBuffer: Buffer.from(await response.arrayBuffer()) };
  } catch (e) {
    logger.error({ error: e }, `Failed to fetch torrent from URL ${torrentUrl}`);
    throw new Error(`Failed to fetch torrent from URL ${torrentUrl}`, { cause: e });
  }
}

export const _cachedFetchTorrent = cacheFunction(
  {
    max: 1_000,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    generateKey: (torrentUrl) => torrentUrl,
  },
  _fetchTorrent,
);

export async function parseTorrentBuffer(
  torrentBuffer: Buffer,
): Promise<ParsedTorrentDetails> {
  const uint8Array = new Uint8Array(torrentBuffer);
  const torrentData = await parseTorrent(uint8Array);
  return {
    infoHash: torrentData.infoHash,
    name: torrentData.name || 'unknown',
    files:
      torrentData.files?.map((file) => ({
        name: file.name,
        length: file.length,
        offset: file.offset,
        path: file.path,
      })) ?? [],
  };
}

export async function downloadAndParseTorrent(torrentUrl: string): Promise<{
  torrentBuffer: Buffer;
  torrentFileData: ParsedTorrentDetails;
}> {
  try {
    logger.info(`Fetching and parsing torrent from URL ${torrentUrl}`);
    const { torrentBuffer } = await _cachedFetchTorrent(torrentUrl);
    const torrentFileData = await parseTorrentBuffer(torrentBuffer);
    return {
      torrentBuffer,
      torrentFileData,
    };
  } catch (e) {
    logger.error({ error: e }, 'Failed to fetch and parse torrent');
    throw new Error('Failed to fetch and parse torrent', { cause: e });
  }
}

export function getExistingTorrents(): DbTorrent[] {
  return db.select().from(torrentsTable).all();
}

import { db } from '@server/db';
import { torrentsTable } from '@server/db/schema';
import { logger } from '@server/logger';
import { createCacheAgent } from '@server/utils/undici';
import parseTorrent from 'parse-torrent';
import { fetch } from 'undici';

import type { DbTorrent, ParsedTorrentDetails } from './torrent.types';

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

const cacheAgent = createCacheAgent({
  cacheByDefault: CACHE_TTL,
  methods: ['GET', 'HEAD'],
});

export async function fetchTorrent(
  torrentUrl: string,
): Promise<{ torrentBuffer: Buffer }> {
  try {
    const response = await fetch(torrentUrl, {
      signal: AbortSignal.timeout(5_000),
      dispatcher: cacheAgent,
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch torrent from URL ${torrentUrl}. Status: ${response.status}`,
      );
    }
    return { torrentBuffer: Buffer.from(await response.arrayBuffer()) };
  } catch (error) {
    logger.error(`Failed to fetch torrent from URL ${torrentUrl}`, { error });
    throw new Error(`Failed to fetch torrent from URL ${torrentUrl}`, { cause: error });
  }
}

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
    const { torrentBuffer } = await fetchTorrent(torrentUrl);
    const torrentFileData = await parseTorrentBuffer(torrentBuffer);
    return {
      torrentBuffer,
      torrentFileData,
    };
  } catch (error) {
    logger.error('Failed to fetch and parse torrent', { error });
    throw new Error('Failed to fetch and parse torrent', { cause: error });
  }
}

export function getExistingTorrents(): DbTorrent[] {
  return db.select().from(torrentsTable).all();
}

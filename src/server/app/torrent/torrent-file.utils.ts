import * as parseTorrentFile from '@ctrl/torrent-file';
import { db } from '@server/db';
import { torrentsTable } from '@server/db/schema';
import { logger } from '@server/logger';
import { createCacheAgent } from '@server/utils/undici';
import { fetch } from 'undici';

import type { DbTorrent, ParsedTorrentDetails } from './torrent.types';

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const FETCH_TIMEOUT = 5_000;

const cacheAgent = createCacheAgent(
  {
    cacheByDefault: CACHE_TTL,
    methods: ['GET', 'HEAD'],
  },
  {
    maxRetries: 2,
    minTimeout: 250,
    timeoutFactor: 2,
    methods: ['GET'],
    retryAfter: true,
  },
);

export async function fetchTorrent(
  torrentUrl: string,
): Promise<{ torrentBuffer: Buffer }> {
  try {
    const response = await fetch(torrentUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
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

export function parseTorrentBuffer(torrentBuffer: Buffer): ParsedTorrentDetails {
  const uint8Array = new Uint8Array(torrentBuffer);
  const info = parseTorrentFile.info(uint8Array);
  const infoHash = parseTorrentFile.hash(uint8Array);
  const files = parseTorrentFile.files(uint8Array);
  return {
    infoHash,
    name: info.name,
    files: files.files.map((file) => ({
      name: file.name,
      length: file.length,
      offset: file.offset,
      path: file.path,
    })),
  };
}

export async function downloadAndParseTorrent(torrentUrl: string): Promise<{
  torrentBuffer: Buffer;
  torrentFileData: ParsedTorrentDetails;
}> {
  try {
    logger.info(`Fetching and parsing torrent from URL ${torrentUrl}`);
    const { torrentBuffer } = await fetchTorrent(torrentUrl);
    const torrentFileData = parseTorrentBuffer(torrentBuffer);
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

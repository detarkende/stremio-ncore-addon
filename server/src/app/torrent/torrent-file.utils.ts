import { globSync } from 'node:fs';
import parseTorrent from 'parse-torrent';
import contentDisposition from 'content-disposition';
import { writeFileWithCreateDir } from 'src/utils/files';
import { env } from 'src/env';
import { cacheFunction, DEFAULT_TTL } from 'src/utils/cache';
import { logger } from 'src/logger';
import type { ParsedTorrentDetails } from './torrent.types';

export const _fetchTorrent = cacheFunction(
  {
    max: 1_000,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    generateKey: (torrentUrl) => torrentUrl,
  },
  async (
    torrentUrl: string,
  ): Promise<{ torrentBuffer: ArrayBuffer; fileName: string }> => {
    try {
      const response = await fetch(torrentUrl, { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) {
        logger.error(
          { status: response.status },
          `Failed to fetch torrent from URL ${torrentUrl}`,
        );
        throw new Error(
          `Failed to fetch torrent from URL ${torrentUrl}. Status: ${response.status}`,
        );
      }
      const fileName = contentDisposition
        .parse(response.headers.get('content-disposition') ?? '')
        .parameters.filename?.replace(/\.torrent$/i, '');

      return { torrentBuffer: await response.arrayBuffer(), fileName };
    } catch (e) {
      logger.error({ error: e }, `Failed to fetch torrent from URL ${torrentUrl}`);
      throw new Error(`Failed to fetch torrent from URL ${torrentUrl}`, { cause: e });
    }
  },
);

export async function downloadAndParseTorrent(
  torrentUrl: string,
): Promise<ParsedTorrentDetails> {
  try {
    logger.info(`Fetching and parsing torrent from URL ${torrentUrl}`);
    const { torrentBuffer } = await _fetchTorrent(torrentUrl);
    const torrentData = await parseTorrent(new Uint8Array(torrentBuffer));
    return {
      infoHash: torrentData.infoHash,
      files:
        torrentData.files?.map((file) => ({
          name: file.name,
          length: file.length,
          offset: file.offset,
          path: file.path,
        })) ?? [],
    };
  } catch (e) {
    logger.error({ error: e }, 'Failed to fetch and parse torrent');
    throw new Error('Failed to fetch and parse torrent', { cause: e });
  }
}

export async function downloadTorrentFile(torrentUrl: string): Promise<string> {
  logger.info(`Downloading torrent file from URL ${torrentUrl}`);
  try {
    const { torrentBuffer, fileName } = await _fetchTorrent(torrentUrl);
    const parsedTorrent = await parseTorrent(new Uint8Array(torrentBuffer));

    const torrentFilePath = `${env.TORRENTS_DIR}/${fileName}-${parsedTorrent.infoHash}.torrent`;

    writeFileWithCreateDir(torrentFilePath, Buffer.from(torrentBuffer));
    logger.info(`Torrent file downloaded to ${torrentFilePath}`);
    return torrentFilePath;
  } catch (e) {
    logger.error({ error: e }, 'Failed to download torrent file');
    throw new Error('Failed to download torrent file', { cause: e });
  }
}

export function getExistingTorrentFilePaths(): string[] {
  return globSync(`${env.TORRENTS_DIR}/*.torrent`);
}

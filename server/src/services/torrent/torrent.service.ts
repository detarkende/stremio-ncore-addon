import parseTorrent from 'parse-torrent';
import contentDisposition from 'content-disposition';
import type { ParsedTorrentDetails } from './types';
import { writeFileWithCreateDir } from '@/utils/files';
import { env } from '@/env';
import { Cached, DEFAULT_TTL } from '@/utils/cache';
import { throwServerError } from '@/utils/errors';
import { logger } from '@/logger';

export class TorrentService {
  @Cached({
    max: 1_000,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    generateKey: (torrentUrl) => torrentUrl,
  })
  public async downloadAndParseTorrent(
    torrentUrl: string,
  ): Promise<ParsedTorrentDetails> {
    try {
      logger.info(`Fetching and parsing torrent from URL ${torrentUrl}`);
      const torrentResponse = await fetch(torrentUrl, {
        signal: AbortSignal.timeout(5_000),
      });
      const buffer = await torrentResponse.arrayBuffer();
      const torrentData = await parseTorrent(new Uint8Array(buffer));
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
      logger.error(
        {
          error: e,
        },
        `Failed to fetch and parse torrent from URL ${torrentUrl}`,
      );
      throw throwServerError(e, 'Failed to parse torrent');
    }
  }

  /**
   * @returns the path to the downloaded torrent file
   */
  public async downloadTorrentFile(torrentUrl: string): Promise<string> {
    logger.info(`Downloading torrent file from URL ${torrentUrl}`);
    try {
      const torrentReq = await fetch(torrentUrl, { signal: AbortSignal.timeout(5_000) });
      const torrentArrayBuffer = await torrentReq.arrayBuffer();
      const parsedTorrent = await parseTorrent(new Uint8Array(torrentArrayBuffer));
      // torrent file name without the .torrent extension
      const torrentFileName = contentDisposition
        .parse(torrentReq.headers.get('content-disposition') ?? '')
        .parameters.filename?.replace(/\.torrent$/i, '');

      const torrentFilePath = `${env.TORRENTS_DIR}/${torrentFileName}-${parsedTorrent.infoHash}.torrent`;

      writeFileWithCreateDir(torrentFilePath, Buffer.from(torrentArrayBuffer));
      logger.info(`Torrent file downloaded to ${torrentFilePath}`);
      return torrentFilePath;
    } catch (e) {
      logger.error(
        {
          error: e,
        },
        `Failed to download torrent file from URL ${torrentUrl}`,
      );
      throw throwServerError(e, 'Failed to download torrent file');
    }
  }
}

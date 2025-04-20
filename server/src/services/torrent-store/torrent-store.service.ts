import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { globSync } from 'glob';
import type { TorrentSourceManager } from '../torrent-source';
import type { TorrentResponse, TorrentStoreStats } from './types';
import { TorrentServerSdk } from './torrent-server.sdk';
import { env } from '@/env';
import { formatBytes } from '@/utils/bytes';
import { sleep } from '@/utils/sleep';
import { logger } from '@/logger';

export class TorrentStoreService {
  private torrentServerUrl: string = `http://localhost:${env.TORRENT_SERVER_PORT}`;
  private torrentServerInstance: ChildProcessWithoutNullStreams | null = null;
  private torrentServerSdk: TorrentServerSdk = new TorrentServerSdk(
    this.torrentServerUrl,
  );

  constructor(private torrentSource: TorrentSourceManager) {}

  public async startServer() {
    if (env.NODE_ENV === 'production') {
      logger.info('Starting torrent server child process');
      const executablePath = resolve(
        import.meta.dirname,
        '../../../torrent-server/torrent-server',
      );
      this.torrentServerInstance = spawn(executablePath, [
        '-p',
        `${env.TORRENT_SERVER_PORT}`,
        '-d',
        env.DOWNLOADS_DIR,
      ]);
    } else {
      let isServerUp = false,
        retryCount = 0;
      while (!isServerUp && retryCount < 5) {
        try {
          retryCount++;
          logger.info(`Looking for torrent server. Try #${retryCount}`);
          await sleep(1000);
          await fetch(this.torrentServerSdk.getHealthCheckUrl());
          isServerUp = true;
          logger.info('Found torrent server.');
        } catch {
          if (retryCount >= 5) {
            logger.fatal(
              'Torrent server is not running. Please start the torrent server first.',
            );
            throw new Error(
              'Torrent server is not running. Please start the torrent server first.',
            );
            // process.exit(1);
          } else {
            logger.info(`Server is not up yet. Retrying in 1 second`);
          }
        }
      }
    }
  }

  private checkServer() {
    if (this.torrentServerInstance === null && env.NODE_ENV === 'production') {
      throw Error(
        'The torrent server is not running. You need to initialize it first. This is a bug, please create an issue on github.',
      );
    }
  }

  public async addTorrent(torrentFilePath: string): Promise<TorrentResponse> {
    logger.info(`Adding torrent file to torrent client: ${torrentFilePath}`);
    this.checkServer();
    const torrent = await this.torrentServerSdk.addTorrent(torrentFilePath);
    return torrent;
  }

  public async getTorrent(infoHash: string): Promise<TorrentResponse | null> {
    logger.info(`Getting torrent info from torrent client for info hash "${infoHash}"`);
    this.checkServer();
    const torrent = await this.torrentServerSdk.getTorrent(infoHash);
    if (!torrent) {
      logger.info(`Torrent with info hash "${infoHash}" not found.`);
    } else {
      logger.info(`Torrent with info hash "${infoHash}" found.`);
    }
    return torrent;
  }

  public async deleteTorrent(infoHash: string): Promise<void> {
    logger.info(`Deleting torrent from torrent client with info hash "${infoHash}"`);
    this.checkServer();
    return await this.torrentServerSdk.deleteTorrent(infoHash);
  }

  public async getStoreStats(): Promise<TorrentStoreStats[]> {
    logger.info('Getting torrent client statistics');
    this.checkServer();
    const torrents = await this.torrentServerSdk.getAllTorrents();
    const stats = torrents
      .map(
        (t) =>
          ({
            hash: t.infoHash,
            name: t.name,
            size: formatBytes(t.size),
            downloaded: formatBytes(t.downloaded),
            progress: `${(t.progress * 100).toFixed(2)}%`,
          }) satisfies TorrentStoreStats,
      )
      .sort((a, z) => a.name.localeCompare(z.name));
    return stats;
  }

  public getFileStreamingUrl({
    infoHash,
    filePath,
  }: {
    infoHash: string;
    filePath: string;
  }) {
    return this.torrentServerSdk.getFileStreamingUrl(infoHash, filePath);
  }

  public async loadExistingTorrents(): Promise<void> {
    logger.info('Loading existing torrents into torrent client');
    this.checkServer();
    const savedTorrentFilePaths = globSync(`${env.TORRENTS_DIR}/*.torrent`);
    logger.info(
      { torrentFiles: savedTorrentFilePaths },
      `Found ${savedTorrentFilePaths.length} torrent files.`,
    );
    await Promise.allSettled(
      savedTorrentFilePaths.map((filePath) => {
        return this.addTorrent(filePath);
      }),
    );
    logger.info('Torrent files loaded and verified.');
  }

  public deleteUnnecessaryTorrents = async () => {
    logger.info('Gathering unnecessary torrents');
    this.checkServer();
    const deletableInfoHashes = await this.torrentSource.getRemovableInfoHashes();
    logger.info(
      { deletableInfoHashes },
      `Found ${deletableInfoHashes.length} deletable torrents.`,
    );

    const promises = deletableInfoHashes.map(async (infoHash) => {
      const torrent = await this.getTorrent(infoHash);
      if (torrent) {
        await this.deleteTorrent(infoHash);
        logger.info(`Successfully deleted ${torrent.name} - ${torrent.infoHash}.`);
      }
    });
    const results = await Promise.allSettled(promises);
    const failed = results.filter((result) => result.status === 'rejected');
    const succeeded = results.filter((result) => result.status === 'fulfilled');
    if (failed.length > 0) {
      logger.error(
        { failed },
        `Failed to delete ${failed.length} torrents. Please check the logs.`,
      );
    }
    if (succeeded.length > 0) {
      logger.info(`Successfully deleted ${succeeded.length} torrents.`);
    }
  };
}

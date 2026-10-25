import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { db } from '@server/db';
import { torrentsTable } from '@server/db/schema';
import { env } from '@server/env';
import { logger } from '@server/logger';
import { getHighestCommonDir } from '@server/utils/files';
import { eq } from 'drizzle-orm';
import {
  type Torrent as WebtorrentTorrent,
  type Instance as WebtorrentInstance,
} from 'webtorrent';
import WebTorrent from 'webtorrent';

import { ncoreService } from '../ncore/index';
import { getExistingTorrents } from './torrent-file.utils';
import type { DbTorrent, Torrent } from './torrent.types';

export class TorrentClient {
  private webtorrent: WebtorrentInstance;

  // Torrents that are currently being added to the client. This is used to prevent adding the same torrent multiple times concurrently.
  private pendingTorrents: Map<string, Promise<WebtorrentTorrent>> = new Map();

  constructor(port?: number) {
    this.webtorrent = new WebTorrent({
      torrentPort: port,
      utp: false,
    });
  }

  private mapToTorrentResponse(torrent: WebtorrentTorrent): Torrent {
    return {
      infoHash: torrent.infoHash,
      name: torrent.name,
      size: torrent.length,
      progress: torrent.progress,
      downloaded: torrent.downloaded,
      path: torrent.path,
      files: torrent.files.map((file) => ({
        name: file.name,
        path: file.path,
        size: file.length,
        progress: file.progress,
        getStream: file.stream.bind(file),
      })),
    };
  }

  private setupVerifiedListener(torrent: WebtorrentTorrent, dbTorrent: DbTorrent): void {
    torrent.on('verified', () => {
      db.update(torrentsTable)
        .set({ bitfield: torrent.bitfield.buffer })
        .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
        .run();
    });
  }

  private setupPreloadListeners(torrent: WebtorrentTorrent): void {
    const selectedFiles = new Set<string>();

    const checkPreload = () => {
      if (torrent.progress >= env.PRELOAD_TORRENT_THRESHOLD) {
        torrent.select(0, torrent.pieces.length - 1);
        torrent.removeListener('download', checkPreload);
        return;
      }
      for (const file of torrent.files) {
        if (
          !selectedFiles.has(file.path) &&
          file.progress >= env.PRELOAD_TORRENT_FILE_THRESHOLD
        ) {
          file.select();
          selectedFiles.add(file.path);
        }
      }
    };

    torrent.on('download', checkPreload);
    checkPreload();
  }

  public async addTorrent(dbTorrent: DbTorrent, isNewTorrent: boolean): Promise<Torrent> {
    try {
      const torrentPromise = new Promise<WebtorrentTorrent>((resolve, reject) => {
        try {
          this.webtorrent.add(
            dbTorrent.torrentFile,
            {
              path: env.DOWNLOADS_DIR,
              deselect: true,
              storeCacheSlots: 0,
              bitfield: isNewTorrent ? undefined : dbTorrent.bitfield,
            },
            (torrent: WebtorrentTorrent) => {
              resolve(torrent);
            },
          );
        } catch (error: unknown) {
          reject(error);
        }
      });
      this.pendingTorrents.set(dbTorrent.infoHash, torrentPromise);
      const torrent = await torrentPromise.finally(() =>
        this.pendingTorrents.delete(dbTorrent.infoHash),
      );
      this.setupVerifiedListener(torrent, dbTorrent);
      this.setupPreloadListeners(torrent);
      return this.mapToTorrentResponse(torrent);
    } catch (error: unknown) {
      logger.error(`Failed to add torrent "${dbTorrent.name}"`, { error });
      throw new Error(`Failed to add torrent "${dbTorrent.name}"`, {
        cause: error,
      });
    }
  }

  public async getTorrent(infoHash: string): Promise<Torrent | null> {
    let torrent: WebtorrentTorrent | null = null;

    const pendingTorrentPromise = this.pendingTorrents.get(infoHash);
    if (pendingTorrentPromise) {
      torrent = await pendingTorrentPromise;
    } else {
      torrent = await this.webtorrent.get(infoHash);
    }
    if (!torrent) {
      return null;
    }
    return this.mapToTorrentResponse(torrent);
  }

  public async deleteTorrent(infoHash: string): Promise<void | Error> {
    try {
      const torrent = await this.webtorrent.get(infoHash);
      if (!torrent) {
        logger.warn('Torrent not found when trying to delete', { infoHash });
        return new Error('Torrent not found');
      }
      const torrentRootPath = getHighestCommonDir(torrent.files.map((file) => file.path));
      db.transaction((tx) => {
        tx.delete(torrentsTable).where(eq(torrentsTable.infoHash, infoHash)).run();
        rmSync(join(env.DOWNLOADS_DIR, torrentRootPath), { recursive: true });
        torrent.destroy({ destroyStore: true });
      });
      return;
    } catch (error: unknown) {
      logger.error('Failed to delete torrent', { error, infoHash });
      return new Error('Error while deleting torrent', { cause: error });
    }
  }

  public async getStoreStats(): Promise<Torrent[]> {
    try {
      const stats = this.webtorrent.torrents.map(this.mapToTorrentResponse.bind(this));
      return stats.sort((a, z) => a.name.localeCompare(z.name));
    } catch (error: unknown) {
      logger.error('Failed to get store stats', { error });
      throw new Error('Failed to get store stats', { cause: error });
    }
  }

  public async loadExistingTorrents() {
    const torrents = getExistingTorrents();

    for (const torrent of torrents) {
      logger.info(`Loading existing torrent: ${torrent.name} (${torrent.infoHash})`);
      try {
        await this.addTorrent(torrent, false);
        logger.info(
          `Successfully loaded existing torrent: ${torrent.name} (${torrent.infoHash})`,
        );
      } catch (error: unknown) {
        logger.error('Failed to load existing torrent', {
          error,
          infoHash: torrent.infoHash,
          name: torrent.name,
        });
      }
    }
  }

  public async getUnnecessaryTorrents(): Promise<Torrent[]> {
    const seedRequiredNcoreInfohashes =
      await ncoreService.getSeedRequiredNcoreInfoHashes();

    const unnecessaryTorrents: Torrent[] = [];
    for (const torrent of this.webtorrent.torrents) {
      if (!seedRequiredNcoreInfohashes.includes(torrent.infoHash)) {
        unnecessaryTorrents.push(this.mapToTorrentResponse(torrent));
      }
    }
    return unnecessaryTorrents;
  }

  public async deleteUnnecessaryTorrents() {
    const unnecessaryTorrents = await this.getUnnecessaryTorrents();
    let results: { deleted: Torrent[]; failed: { torrent: Torrent; error: Error }[] } = {
      deleted: [],
      failed: [],
    };
    for (const torrent of unnecessaryTorrents) {
      const error = await this.deleteTorrent(torrent.infoHash);
      if (error) {
        logger.error(
          `Failed to delete unnecessary torrent: ${torrent.name || torrent.infoHash}`,
          {
            infoHash: torrent.infoHash,
            error,
          },
        );
        results.failed.push({ torrent, error });
      } else {
        logger.info(`Deleted unnecessary torrent: ${torrent.name || torrent.infoHash}`);
        results.deleted.push(torrent);
      }
    }
    return results;
  }

  public async destroy() {
    await new Promise<void>((resolve, reject) => {
      try {
        this.webtorrent.destroy((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      } catch (error: unknown) {
        reject(error);
      }
    });
  }
}

export const torrentClient = new TorrentClient(env.TORRENT_PORT);

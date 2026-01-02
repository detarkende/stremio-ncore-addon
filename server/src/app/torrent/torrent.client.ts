import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { env } from 'src/env';
import { logger } from 'src/logger';
import {
  type Torrent as WebtorrentTorrent,
  type Instance as WebtorrentInstance,
} from 'webtorrent';
import WebTorrent from 'webtorrent';
import { torrentsTable, type DbTorrent } from 'src/db/schema/torrents';
import { db } from 'src/db';
import { eq } from 'drizzle-orm';
import { getHighestCommonDir } from 'src/utils/files';
import { ncoreService } from '../ncore';
import { getExistingTorrents } from './torrent-file.utils';
import type { Torrent } from './torrent.types';

export class TorrentClient {
  private webtorrent: WebtorrentInstance;

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

  public async addTorrent(dbTorrent: DbTorrent, isNewTorrent: boolean): Promise<Torrent> {
    try {
      const torrent = await new Promise<WebtorrentTorrent>((resolve, reject) => {
        try {
          this.webtorrent.add(
            dbTorrent.torrentFile,
            {
              path: env.DOWNLOADS_DIR,
              deselect: true,
              storeCacheSlots: 0,
              bitfield: isNewTorrent ? undefined : dbTorrent.bitfield,
              // skipVerify,
            },
            (torrent: WebtorrentTorrent) => {
              resolve(torrent);
            },
          );
        } catch (error: unknown) {
          reject(error);
        }
      });
      torrent.on('verified', () => {
        db.update(torrentsTable)
          .set({ bitfield: torrent.bitfield.buffer })
          .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
          .run();
      });
      return this.mapToTorrentResponse(torrent);
    } catch (error: unknown) {
      logger.error({ error }, `Failed to add torrent "${dbTorrent.name}"`);
      throw new Error(`Failed to add torrent "${dbTorrent.name}"`, {
        cause: error,
      });
    }
  }

  public async getTorrent(infoHash: string): Promise<Torrent | null> {
    const torrent = await this.webtorrent.get(infoHash);
    if (!torrent) {
      return null;
    }
    return this.mapToTorrentResponse(torrent);
  }

  public async deleteTorrent(infoHash: string): Promise<void | Error> {
    try {
      const torrent = await this.webtorrent.get(infoHash);
      if (!torrent) {
        logger.warn({ infoHash }, 'Torrent not found when trying to delete');
        return new Error('Torrent not found');
      }
      const torrentRootPath = getHighestCommonDir(torrent.files.map((file) => file.path));
      if (!torrentRootPath) {
        logger.warn(
          { infoHash, name: torrent.name },
          'Could not determine torrent root path',
        );
        return new Error('Could not determine torrent root path');
      }
      db.transaction((tx) => {
        tx.delete(torrentsTable).where(eq(torrentsTable.infoHash, infoHash)).run();
        rmSync(join(env.DOWNLOADS_DIR, torrentRootPath), { recursive: true });
        torrent.destroy({ destroyStore: true });
      });
      return;
    } catch (error: unknown) {
      logger.error({ error, infoHash }, 'Failed to delete torrent');
      return new Error('Error while deleting torrent', { cause: error });
    }
  }

  public async getStoreStats(): Promise<Torrent[]> {
    try {
      const stats = this.webtorrent.torrents.map(this.mapToTorrentResponse.bind(this));
      return stats.sort((a, z) => a.name.localeCompare(z.name));
    } catch (error: unknown) {
      logger.error({ error }, 'Failed to get store stats');
      throw new Error('Failed to get store stats', { cause: error });
    }
  }

  public async loadExistingTorrents() {
    const torrents = getExistingTorrents();
    await Promise.all(
      torrents.map(async (torrent) => {
        logger.info(`Loading existing torrent: ${torrent.name} (${torrent.infoHash})`);
        try {
          await this.addTorrent(torrent, false);
          logger.info(
            `Successfully loaded existing torrent: ${torrent.name} (${torrent.infoHash})`,
          );
        } catch (error: unknown) {
          logger.error(
            { error, infoHash: torrent.infoHash, name: torrent.name },
            'Failed to load existing torrent',
          );
        }
      }),
    );
  }

  public async deleteUnnecessaryTorrents() {
    const deletableInfoHashes = await ncoreService.getRemovableInfoHashes();
    for (const infoHash of deletableInfoHashes) {
      const torrent = await this.getTorrent(infoHash);
      const error = await this.deleteTorrent(infoHash);
      if (error) {
        logger.error(
          { infoHash, error },
          `Failed to delete unnecessary torrent: ${torrent?.name || infoHash}`,
        );
      } else {
        logger.info(`Deleted unnecessary torrent: ${torrent?.name || infoHash}`);
      }
    }
  }
}

export const torrentClient = new TorrentClient(env.TORRENT_PORT);

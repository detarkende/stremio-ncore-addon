import { env } from '@server/env';
import { logger } from '@server/logger';
import {
  type Torrent as WebtorrentTorrent,
  type Instance as WebtorrentInstance,
} from 'webtorrent';
import WebTorrent from 'webtorrent';

import type { DbTorrent } from './torrent.types';

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

  private setupVerifiedListener(
    torrent: WebtorrentTorrent,
    onVerified: (torrent: WebtorrentTorrent) => void,
  ): void {
    torrent.on('verified', () => {
      onVerified(torrent);
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

  public async addTorrent(
    dbTorrent: DbTorrent,
    isNewTorrent: boolean,
    onVerified: (torrent: WebtorrentTorrent) => void,
  ): Promise<WebtorrentTorrent> {
    try {
      const torrentPromise = new Promise<WebtorrentTorrent>((resolve, reject) => {
        try {
          const torrent = this.webtorrent.add(
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
          this.setupVerifiedListener(torrent, onVerified);
        } catch (error: unknown) {
          reject(error);
        }
      });
      this.pendingTorrents.set(dbTorrent.infoHash, torrentPromise);
      const torrent = await torrentPromise.finally(() =>
        this.pendingTorrents.delete(dbTorrent.infoHash),
      );
      this.setupPreloadListeners(torrent);
      return torrent;
    } catch (error: unknown) {
      logger.error(`Failed to add torrent "${dbTorrent.name}"`, { error });
      throw new Error(`Failed to add torrent "${dbTorrent.name}"`, {
        cause: error,
      });
    }
  }

  public async getTorrent(infoHash: string): Promise<WebtorrentTorrent | null> {
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
    return torrent;
  }

  public async getTorrents(): Promise<WebtorrentTorrent[]> {
    return this.webtorrent.torrents;
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

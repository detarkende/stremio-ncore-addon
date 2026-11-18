import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { db } from '@server/db';
import { torrentsTable, usersTable, usersTorrentsTable } from '@server/db/schema';
import { env } from '@server/env';
import { logger } from '@server/logger/logger';
import { getHighestCommonDir } from '@server/utils/files';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { type Torrent as WebtorrentTorrent } from 'webtorrent';

import { ncoreService } from '../ncore';
import type { NcoreService } from '../ncore/ncore.service';
import type { StreamType } from '../stream/stream.constants';
import { downloadAndParseTorrent, parseTorrentBuffer } from './torrent-file.utils';
import { TorrentClient } from './torrent.client';
import type {
  DbTorrent,
  DeleteUnnecessaryTorrentsResponse,
  Torrent,
  TorrentViewer,
  TorrentWithViewers,
  UnnecessaryTorrent,
} from './torrent.types';
import { insertNewTorrent } from './torrent.utils';

export class TorrentStore {
  private pendingTorrentInitializations = new Map<string, Promise<WebtorrentTorrent>>();
  private torrentClient: TorrentClient;
  private ncoreService: NcoreService;
  private onVerified = (torrent: WebtorrentTorrent): void => {
    db.update(torrentsTable)
      .set({ bitfield: torrent.bitfield.buffer })
      .where(eq(torrentsTable.infoHash, torrent.infoHash))
      .run();
  };

  constructor(
    ncoreService: NcoreService,
    torrentClient: TorrentClient = new TorrentClient(env.TORRENT_PORT),
  ) {
    this.torrentClient = torrentClient;
    this.ncoreService = ncoreService;
  }

  private mapWebtorrentToResponse(torrent: WebtorrentTorrent): Torrent {
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

  public async addTorrent({
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
    const existingTorrent = await this.torrentClient.getTorrent(infoHash);
    if (existingTorrent) {
      return this.mapWebtorrentToResponse(existingTorrent);
    }

    const pendingInitialization = this.pendingTorrentInitializations.get(infoHash);
    if (pendingInitialization) {
      return this.mapWebtorrentToResponse(await pendingInitialization);
    }

    const initialization = (async () => {
      const ncoreUrl = await this.ncoreService.getTorrentUrlByNcoreId(torrentSourceId);
      const { torrentFileData, torrentBuffer } = await downloadAndParseTorrent(ncoreUrl);
      const dbTorrent = insertNewTorrent({
        imdbId,
        torrentBuffer,
        torrentFileData,
        type,
        userId,
      });
      const torrent = await this.torrentClient.addTorrent(
        dbTorrent,
        true,
        this.onVerified,
      );

      return torrent;
    })();

    this.pendingTorrentInitializations.set(infoHash, initialization);
    try {
      return this.mapWebtorrentToResponse(await initialization);
    } finally {
      if (this.pendingTorrentInitializations.get(infoHash) === initialization) {
        this.pendingTorrentInitializations.delete(infoHash);
      }
    }
  }

  public async getTorrent(infoHash: string): Promise<Torrent | null> {
    const isPending = this.pendingTorrentInitializations.has(infoHash);

    const torrent = await (isPending
      ? this.pendingTorrentInitializations.get(infoHash)!
      : this.torrentClient.getTorrent(infoHash));

    return torrent ? this.mapWebtorrentToResponse(torrent) : null;
  }

  public async deleteTorrent(infoHash: string): Promise<Error | null> {
    try {
      // if there is a pending initialization for this torrent, wait for it to complete before deleting
      if (this.pendingTorrentInitializations.has(infoHash)) {
        await this.pendingTorrentInitializations.get(infoHash);
        this.pendingTorrentInitializations.delete(infoHash);
      }

      const clientTorrent = await this.torrentClient.getTorrent(infoHash);
      const torrentFileData = db
        .select({ torrentFile: torrentsTable.torrentFile })
        .from(torrentsTable)
        .where(eq(torrentsTable.infoHash, infoHash))
        .get()?.torrentFile;

      const torrentFiles = torrentFileData
        ? parseTorrentBuffer(torrentFileData).files
        : (clientTorrent?.files ?? []);
      const torrentFilePaths = torrentFiles.map((file) => file.path);
      const torrentDir = getHighestCommonDir(torrentFilePaths);

      rmSync(join(env.DOWNLOADS_DIR, torrentDir), { recursive: true });
      clientTorrent?.destroy();
      db.delete(torrentsTable).where(eq(torrentsTable.infoHash, infoHash)).run();
      return null;
    } catch (error) {
      logger.error(`Failed to delete torrent: ${infoHash}`, { infoHash, error });
      return error as Error;
    }
  }

  public async getStoreStats(): Promise<TorrentWithViewers[]> {
    const webtorrentTorrents = await this.torrentClient.getTorrents();
    const dbTorrents = db
      .select({
        infoHash: torrentsTable.infoHash,
        viewers: sql<TorrentViewer[]>`
          coalesce(
            json_group_array(
              json_object(
                'userId', ${usersTable.id},
                'username', ${usersTable.username},
                'firstWatchedAt', ${usersTorrentsTable.createdAt},
                'lastWatchedAt', ${usersTorrentsTable.updatedAt}
              )
              ORDER BY ${usersTorrentsTable.updatedAt} DESC
            ) FILTER (WHERE ${usersTable.id} IS NOT NULL),
            json('[]')
          )
        `.mapWith((value) => JSON.parse(String(value)) as TorrentViewer[]),
      })
      .from(torrentsTable)
      .leftJoin(
        usersTorrentsTable,
        eq(torrentsTable.infoHash, usersTorrentsTable.torrentInfoHash),
      )
      .leftJoin(usersTable, eq(usersTorrentsTable.userId, usersTable.id))
      .groupBy(torrentsTable.infoHash)
      .orderBy(sql`min(${usersTorrentsTable.createdAt}) DESC`)
      .all();

    const webtorrentTorrentsByInfoHash = new Map(
      webtorrentTorrents.map((torrent) => [torrent.infoHash, torrent]),
    );
    const torrents: TorrentWithViewers[] = [];
    for (const dbTorrent of dbTorrents) {
      const webtorrentTorrent = webtorrentTorrentsByInfoHash.get(dbTorrent.infoHash);
      if (webtorrentTorrent) {
        torrents.push({
          ...this.mapWebtorrentToResponse(webtorrentTorrent),
          viewers: dbTorrent.viewers,
        });
      }
    }
    return torrents;
  }

  public async getUnnecessaryTorrents(): Promise<UnnecessaryTorrent[]> {
    const seedRequiredNcoreInfohashes =
      await this.ncoreService.getSeedRequiredNcoreInfoHashes();
    const dbTorrents = db
      .select({
        infoHash: torrentsTable.infoHash,
        name: torrentsTable.name,
      })
      .from(torrentsTable)
      .all();

    return dbTorrents.filter(
      (torrent) => !seedRequiredNcoreInfohashes.includes(torrent.infoHash),
    );
  }

  public async deleteUnnecessaryTorrents(): Promise<DeleteUnnecessaryTorrentsResponse> {
    const unnecessaryTorrents = await this.getUnnecessaryTorrents();
    const results: DeleteUnnecessaryTorrentsResponse = { deleted: [], failed: [] };
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

  public async loadExistingTorrents(): Promise<void> {
    const dbTorrents: DbTorrent[] = db.select().from(torrentsTable).all();

    for (const torrent of dbTorrents) {
      try {
        logger.info(`Loading existing torrent: ${torrent.name}`);
        await this.torrentClient.addTorrent(torrent, false, this.onVerified);
        logger.info(`Successfully loaded existing torrent: ${torrent.name}`);
      } catch (error) {
        logger.error(`Failed to load existing torrent: ${torrent.name}`, { error });
      }
    }
  }

  public async destroy(): Promise<void> {
    await this.torrentClient.destroy();
  }
}

export const torrentStore = new TorrentStore(ncoreService);

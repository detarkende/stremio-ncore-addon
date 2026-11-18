import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { NcoreService } from '@server/app/ncore/ncore.service';
import { db } from '@server/db';
import { torrentsTable, usersTorrentsTable } from '@server/db/schema';
import { env } from '@server/env';
import { fetchMock } from '@server/test-utils/fetch-mock';
import { createMockFile, createSeededTorrent } from '@server/test-utils/torrent';
import { createTestUser } from '@server/test-utils/users';
import { and, eq, sql } from 'drizzle-orm';
import type { Torrent as WebtorrentTorrent } from 'webtorrent';

import { TorrentClient } from '../torrent.client';
import { TorrentStore } from '../torrent.store';
import { insertNewTorrent } from '../torrent.utils';

const firstFiles = [
  createMockFile('First.Movie/First.Movie.mkv', 256 * 1024),
  createMockFile('First.Movie/First.Movie.srt', 1024),
];
const secondFiles = [
  createMockFile('Second.Movie/Second.Movie.mkv', 256 * 1024),
  createMockFile('Second.Movie/Second.Movie.srt', 1024),
];

const [firstSeed, secondSeed] = await Promise.all([
  createSeededTorrent(firstFiles),
  createSeededTorrent(secondFiles),
]);

describe('TorrentStore', () => {
  let torrentStore: TorrentStore;
  let torrentClient: TorrentClient;
  let ncoreService: NcoreService;
  let userId: number;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });
    env.DOWNLOADS_DIR = tmpDir;

    ncoreService = new NcoreService();
    vi.spyOn(ncoreService, 'getTorrentUrlByNcoreId').mockImplementation(
      async (torrentSourceId) => `https://ncore.test/${torrentSourceId}`,
    );
    torrentClient = new TorrentClient(0);
    torrentStore = new TorrentStore(ncoreService, torrentClient);
    userId = (await createTestUser()).id;
  });

  afterEach(async () => {
    await torrentStore.destroy();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  afterAll(() => {
    firstSeed.cleanup();
    secondSeed.cleanup();
  });

  describe('addTorrent', () => {
    it('downloads, stores, and returns a mapped torrent', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(Buffer.from(firstSeed.seededTorrent.torrentFile)),
      );
      const request = createAddRequest(firstSeed.seededTorrent, userId);
      const missingTorrent = await torrentStore.getTorrent(request.infoHash);

      const torrent = await torrentStore.addTorrent(request);
      const retrievedTorrent = await torrentStore.getTorrent(request.infoHash);

      expect(missingTorrent).toBeNull();
      expect(torrent.infoHash).toBe(firstSeed.seededTorrent.infoHash);
      expect(torrent.name).toBe(firstSeed.seededTorrent.name);
      expect(
        torrent.files.map(({ name, path: filePath, size }) => ({
          name,
          path: filePath,
          size,
        })),
      ).toEqual([
        {
          name: 'First.Movie.mkv',
          path: 'First.Movie/First.Movie.mkv',
          size: firstFiles[0].size,
        },
        {
          name: 'First.Movie.srt',
          path: 'First.Movie/First.Movie.srt',
          size: firstFiles[1].size,
        },
      ]);
      expect(retrievedTorrent?.infoHash).toBe(firstSeed.seededTorrent.infoHash);
      expect(retrievedTorrent?.files[0].getStream).toEqual(expect.any(Function));

      const storedTorrent = db
        .select()
        .from(torrentsTable)
        .where(eq(torrentsTable.infoHash, request.infoHash))
        .get();
      const viewer = db
        .select()
        .from(usersTorrentsTable)
        .where(eq(usersTorrentsTable.torrentInfoHash, request.infoHash))
        .get();

      expect(storedTorrent?.torrentFile).toEqual(
        Buffer.from(firstSeed.seededTorrent.torrentFile),
      );
      expect(viewer?.userId).toBe(userId);
    });

    it('shares one initialization for concurrent requests of the same torrent', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(Buffer.from(firstSeed.seededTorrent.torrentFile)),
      );
      const request = createAddRequest(firstSeed.seededTorrent, userId);

      const results = await Promise.all([
        torrentStore.addTorrent(request),
        torrentStore.addTorrent(request),
      ]);

      expect(results.map(({ infoHash }) => infoHash)).toEqual([
        firstSeed.seededTorrent.infoHash,
        firstSeed.seededTorrent.infoHash,
      ]);
      expect(ncoreService.getTorrentUrlByNcoreId).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(
        db
          .select()
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, request.infoHash))
          .all(),
      ).toHaveLength(1);
    });
  });

  describe('deleteTorrent', () => {
    it('removes the torrent, its database record, and its download directory', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(Buffer.from(firstSeed.seededTorrent.torrentFile)),
      );
      const request = createAddRequest(firstSeed.seededTorrent, userId);
      await torrentStore.addTorrent(request);
      const downloadDir = path.join(env.DOWNLOADS_DIR, 'First.Movie');
      fs.mkdirSync(downloadDir, { recursive: true });

      const result = await torrentStore.deleteTorrent(request.infoHash);

      expect(result).toBeNull();
      expect(await torrentStore.getTorrent(request.infoHash)).toBeNull();
      expect(fs.existsSync(downloadDir)).toBe(false);
      expect(
        db
          .select()
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, request.infoHash))
          .get(),
      ).toBeUndefined();
      expect(
        db
          .select()
          .from(usersTorrentsTable)
          .where(eq(usersTorrentsTable.torrentInfoHash, request.infoHash))
          .get(),
      ).toBeDefined();
    });
  });

  describe('loadExistingTorrents', () => {
    it('loads torrents already stored in the database', async () => {
      const user = await createTestUser();
      const dbTorrent = createDbTorrent(firstSeed.seededTorrent, user.id);

      await torrentStore.loadExistingTorrents();

      const retrievedTorrent = await torrentStore.getTorrent(dbTorrent.infoHash);
      expect(retrievedTorrent?.infoHash).toBe(firstSeed.seededTorrent.infoHash);
    });
  });

  describe('verified bitfields', () => {
    it('persists verified pieces through the store callback', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(Buffer.from(firstSeed.seededTorrent.torrentFile)),
      );
      const request = createAddRequest(firstSeed.seededTorrent, userId);
      const torrent = await torrentStore.addTorrent(request);
      const clientTorrent = await torrentClient.getTorrent(request.infoHash);

      if (!clientTorrent) {
        throw new Error('Torrent was not added to the WebTorrent client');
      }
      clientTorrent.addPeer(firstSeed.peerAddress);

      for await (const chunk of torrent.files[0].getStream({
        start: 0,
        end: firstFiles[0].size - 1,
      })) {
        expect(chunk.length).toBeGreaterThan(0);
      }

      await vi.waitFor(() => {
        const storedTorrent = db
          .select({ bitfield: torrentsTable.bitfield })
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, request.infoHash))
          .get();

        expect(storedTorrent?.bitfield.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStoreStats', () => {
    it('includes viewers and sorts torrents and viewers by their watch times', async () => {
      const firstViewer = await createTestUser({ username: 'first-viewer' });
      const secondViewer = await createTestUser({ username: 'second-viewer' });
      const thirdViewer = await createTestUser({ username: 'third-viewer' });
      const firstDbTorrent = createDbTorrent(firstSeed.seededTorrent, firstViewer.id);
      const secondDbTorrent = createDbTorrent(secondSeed.seededTorrent, thirdViewer.id);

      const firstWatchedAt = new Date('2023-01-01T00:00:00.000Z');
      const secondWatchedAt = new Date('2023-02-01T00:00:00.000Z');
      const lastWatchedAt = new Date('2025-01-01T00:00:00.000Z');
      const secondViewerLastWatchedAt = new Date('2025-02-01T00:00:00.000Z');
      const newestTorrentFirstWatchedAt = new Date('2024-01-01T00:00:00.000Z');

      db.update(usersTorrentsTable)
        .set({
          createdAt: sql`${firstWatchedAt.getTime()}`,
          updatedAt: sql`${lastWatchedAt.getTime()}`,
        })
        .where(
          and(
            eq(usersTorrentsTable.userId, firstViewer.id),
            eq(usersTorrentsTable.torrentInfoHash, firstDbTorrent.infoHash),
          ),
        )
        .run();
      db.insert(usersTorrentsTable)
        .values({
          userId: secondViewer.id,
          torrentInfoHash: firstDbTorrent.infoHash,
          createdAt: sql`${secondWatchedAt.getTime()}`,
          updatedAt: sql`${secondViewerLastWatchedAt.getTime()}`,
        })
        .run();
      db.update(usersTorrentsTable)
        .set({
          createdAt: sql`${newestTorrentFirstWatchedAt.getTime()}`,
          updatedAt: sql`${newestTorrentFirstWatchedAt.getTime()}`,
        })
        .where(
          and(
            eq(usersTorrentsTable.userId, thirdViewer.id),
            eq(usersTorrentsTable.torrentInfoHash, secondDbTorrent.infoHash),
          ),
        )
        .run();

      await torrentStore.loadExistingTorrents();

      const stats = await torrentStore.getStoreStats();

      expect(stats.map(({ infoHash }) => infoHash)).toEqual([
        secondDbTorrent.infoHash,
        firstDbTorrent.infoHash,
      ]);
      expect(stats[1].viewers).toEqual([
        {
          userId: secondViewer.id,
          username: secondViewer.username,
          firstWatchedAt: secondWatchedAt.getTime(),
          lastWatchedAt: secondViewerLastWatchedAt.getTime(),
        },
        {
          userId: firstViewer.id,
          username: firstViewer.username,
          firstWatchedAt: firstWatchedAt.getTime(),
          lastWatchedAt: lastWatchedAt.getTime(),
        },
      ]);
    });
  });

  describe('getUnnecessaryTorrents', () => {
    it('returns torrents not required for seeding', async () => {
      const firstDbTorrent = createDbTorrent(firstSeed.seededTorrent, userId);
      const secondDbTorrent = createDbTorrent(secondSeed.seededTorrent, userId);
      vi.spyOn(ncoreService, 'getSeedRequiredNcoreInfoHashes').mockResolvedValue([
        firstDbTorrent.infoHash,
      ]);

      const unnecessaryTorrents = await torrentStore.getUnnecessaryTorrents();

      expect(unnecessaryTorrents).toEqual([
        {
          infoHash: secondDbTorrent.infoHash,
          name: secondDbTorrent.name,
        },
      ]);
    });
  });

  describe('deleteUnnecessaryTorrents', () => {
    it('deletes torrents that are no longer required for seeding', async () => {
      const requiredTorrent = createDbTorrent(firstSeed.seededTorrent, userId);
      const unnecessaryTorrent = createDbTorrent(secondSeed.seededTorrent, userId);
      vi.spyOn(ncoreService, 'getSeedRequiredNcoreInfoHashes').mockResolvedValue([
        requiredTorrent.infoHash,
      ]);
      const downloadDir = path.join(env.DOWNLOADS_DIR, 'Second.Movie');
      fs.mkdirSync(downloadDir, { recursive: true });

      const result = await torrentStore.deleteUnnecessaryTorrents();

      expect(result.deleted).toEqual([
        {
          infoHash: unnecessaryTorrent.infoHash,
          name: unnecessaryTorrent.name,
        },
      ]);
      expect(result.failed).toEqual([]);
      expect(fs.existsSync(downloadDir)).toBe(false);
      expect(
        db
          .select()
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, requiredTorrent.infoHash))
          .get(),
      ).toBeDefined();
      expect(
        db
          .select()
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, unnecessaryTorrent.infoHash))
          .get(),
      ).toBeUndefined();
    });

    it('reports torrents that fail to delete and keeps their database records', async () => {
      const requiredTorrent = createDbTorrent(firstSeed.seededTorrent, userId);
      const unnecessaryTorrent = createDbTorrent(secondSeed.seededTorrent, userId);
      vi.spyOn(ncoreService, 'getSeedRequiredNcoreInfoHashes').mockResolvedValue([
        requiredTorrent.infoHash,
      ]);

      const result = await torrentStore.deleteUnnecessaryTorrents();

      expect(result.deleted).toEqual([]);
      expect(result.failed).toEqual([
        {
          torrent: {
            infoHash: unnecessaryTorrent.infoHash,
            name: unnecessaryTorrent.name,
          },
          error: expect.objectContaining({
            message: expect.any(String),
          }),
        },
      ]);
      expect(
        db
          .select()
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, unnecessaryTorrent.infoHash))
          .get(),
      ).toBeDefined();
    });
  });
});

function createAddRequest(
  torrent: WebtorrentTorrent,
  userId: number,
): Parameters<TorrentStore['addTorrent']>[0] {
  return {
    userId,
    imdbId: 'tt1234567',
    type: 'movie',
    torrentSourceId: torrent.infoHash,
    infoHash: torrent.infoHash,
  };
}

function createDbTorrent(torrent: WebtorrentTorrent, userId: number) {
  return insertNewTorrent({
    userId,
    imdbId: 'tt1234567',
    type: 'movie',
    torrentBuffer: Buffer.from(torrent.torrentFile),
    torrentFileData: {
      infoHash: torrent.infoHash,
      name: torrent.name,
      files: [],
    },
  });
}

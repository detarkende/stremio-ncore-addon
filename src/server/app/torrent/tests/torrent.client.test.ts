import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ncoreService } from '@server/app/ncore';
import { db } from '@server/db';
import { torrentsTable } from '@server/db/schema';
import { env } from '@server/env';
import { logger } from '@server/logger';
import { createMockFile, createSeededTorrent } from '@server/test-utils/torrent';
import { createTestUserWithSession } from '@server/test-utils/users';
import { eq } from 'drizzle-orm';

import { TorrentClient } from '../torrent.client';
import type { DbTorrent, TorrentFile } from '../torrent.types';
import { insertNewTorrent } from '../torrent.utils';

vi.mock('node:fs', { spy: true });

describe('TorrentClient', async () => {
  let torrentClient: TorrentClient;
  let dbTorrent: DbTorrent;
  const imdbId = 'tt1234567';
  const torrentName = 'The.Movie.2026';

  const file1Name = 'The.Movie.2026.1080p.WEBRip.x264.mkv';
  const file1Size = 1024 * 1024; // 1 MB
  const file1Path = `${torrentName}/${file1Name}`;

  const file2Name = 'The.Movie.2026.1080p.WEBRip.x264.srt';
  const file2Size = 1024 * 512; // 512 KB
  const file2Path = `${torrentName}/${file2Name}`;

  const files: File[] = [
    createMockFile(file1Path, file1Size),
    createMockFile(file2Path, file2Size),
  ];

  let tmpDir: string;

  const {
    seededTorrent,
    peerAddress,
    cleanup: cleanupSeededTorrent,
  } = await createSeededTorrent(files);

  beforeEach(async () => {
    vi.clearAllMocks();

    tmpDir = path.join(os.tmpdir(), crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });
    env.DOWNLOADS_DIR = tmpDir;

    torrentClient = new TorrentClient(0);
    const { user } = await createTestUserWithSession();
    dbTorrent = insertNewTorrent({
      userId: user.id,
      imdbId,
      type: 'movie',
      torrentBuffer: Buffer.from(seededTorrent.torrentFile),
      torrentFileData: {
        infoHash: seededTorrent.infoHash,
        name: 'The.Movie.2026',
        files: [],
      },
    });
  });

  afterEach(async () => {
    await torrentClient.destroy();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  afterAll(() => {
    cleanupSeededTorrent();
  });

  describe('addTorrent', () => {
    it('should add a torrent and return the torrent object', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true);
      torrentClient['webtorrent'].torrents[0].addPeer(peerAddress);

      expect(torrent.infoHash).toBe(seededTorrent.infoHash);
      expect(torrent.name).toBe('The.Movie.2026');
      expect(torrent.files.length).toBe(2);
      expect(torrent.files).toEqual([
        {
          name: file1Name,
          size: file1Size,
          progress: 0,
          path: file1Path,
          getStream: expect.any(Function),
        },
        {
          name: file2Name,
          size: file2Size,
          progress: 0,
          path: file2Path,
          getStream: expect.any(Function),
        },
      ] satisfies TorrentFile[]);
    });

    it('should add the torrent to the pending torrent list while being added then remove it once added', async () => {
      const addTorrentPromise1 = torrentClient.addTorrent(dbTorrent, true);
      expect(torrentClient['pendingTorrents'].has(seededTorrent.infoHash)).toBe(true);

      await addTorrentPromise1;
      expect(torrentClient['pendingTorrents'].has(seededTorrent.infoHash)).toBe(false);
    });
  });

  describe('getTorrent', () => {
    it('should return the torrent object if it exists', async () => {
      await torrentClient.addTorrent(dbTorrent, true);

      const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);

      expect(retrievedTorrent).not.toBeNull();
      expect(retrievedTorrent?.infoHash).toBe(seededTorrent.infoHash);
      expect(retrievedTorrent?.name).toBe('The.Movie.2026');
    });

    it('should return null if the torrent does not exist', async () => {
      const retrievedTorrent = await torrentClient.getTorrent('nonexistentinfohash');
      expect(retrievedTorrent).toBeNull();
    });

    it('should wait for a pending torrent to be added if it is not yet added to the client at the time of the call', async () => {
      torrentClient.addTorrent(dbTorrent, true);

      const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);
      expect(retrievedTorrent).not.toBeNull();
    });
  });

  describe('Streaming', () => {
    it('should stream a file from the torrent and save it to disk', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true);
      torrentClient['webtorrent'].torrents[0].addPeer(peerAddress);

      const fileStream = torrent.files[0].getStream({ start: 0, end: files[0].size - 1 });
      for await (const _chunk of fileStream) {
        // Consume the stream to trigger the download
      }
      const filePath = `${env.DOWNLOADS_DIR}/${file1Path}`;

      expect(fs.existsSync(filePath)).toBe(true);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBe(file1Size);
    });

    it('should update the bitfield in the database when the torrent is downloaded', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true);

      torrentClient['webtorrent'].torrents[0].addPeer(peerAddress);

      const fileStream = torrent.files[0].getStream({ start: 0, end: files[0].size - 1 });
      for await (const _chunk of fileStream) {
        // Consume the stream to trigger the download
      }

      const { bitfield } =
        db
          .select({ bitfield: torrentsTable.bitfield })
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
          .get() ?? {};

      expect(bitfield).toBeDefined();
      expect(bitfield?.length).toBeGreaterThan(0);
      expect(bitfield).toEqual(
        Buffer.from([
          // first file (1 MB) fully downloaded
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          // second file (512 KB) not downloaded
          0x00, 0x00, 0x00, 0x00,
        ]),
      );
    });

    it('should download the whole file when the FILE_PRELOAD_THRESHOLD is reached', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true);
      torrentClient['webtorrent'].torrents[0].addPeer(peerAddress);

      env.PRELOAD_TORRENT_FILE_THRESHOLD = 0.5; // 50% of the file

      const fileStream = torrent.files[0].getStream({
        start: 0,
        end: files[0].size * 0.6 - 1, // 60% of the file
      });
      for await (const _chunk of fileStream) {
        // Consume the stream to trigger the download
      }

      const { bitfield } =
        db
          .select({ bitfield: torrentsTable.bitfield })
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
          .get() ?? {};

      expect(bitfield).toBeDefined();
      expect(bitfield?.length).toBeGreaterThan(0);
      expect(bitfield).toEqual(
        Buffer.from([
          // first file (1 MB) fully downloaded
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          // second file (512 KB) not downloaded
          0x00, 0x00, 0x00, 0x00,
        ]),
      );
    });

    it('should download the whole torrent when the TORRENT_PRELOAD_THRESHOLD is reached', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true);
      torrentClient['webtorrent'].torrents[0].addPeer(peerAddress);

      env.PRELOAD_TORRENT_THRESHOLD = 0.5; // 50% of the torrent

      const fileStream = torrent.files[0].getStream({
        start: 0,
        end: files[0].size - 1,
      });

      for await (const _chunk of fileStream) {
        // Consume the stream to trigger the download
      }

      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for the preload listener to trigger

      const { bitfield } =
        db
          .select({ bitfield: torrentsTable.bitfield })
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
          .get() ?? {};

      expect(bitfield).toBeDefined();
      expect(bitfield?.length).toBeGreaterThan(0);
      expect(bitfield).toEqual(
        Buffer.from([
          // first file (1 MB) fully downloaded
          0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          // second file (512 KB) fully downloaded
          0xff, 0xff, 0xff, 0xff,
        ]),
      );
    });
  });

  describe('deleteTorrent', () => {
    it('should delete a torrent and remove it from the client', async () => {
      await torrentClient.addTorrent(dbTorrent, true);
      await torrentClient.deleteTorrent(seededTorrent.infoHash);

      const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);
      expect(torrentClient['webtorrent'].torrents.length).toBe(0);
      expect(retrievedTorrent).toBeNull();
      expect(vi.mocked(fs.rmSync)).toHaveBeenCalledWith(
        `${env.DOWNLOADS_DIR}/${torrentName}`,
        {
          recursive: true,
        },
      );
      const dbTorrentAfterDeletion = db
        .select()
        .from(torrentsTable)
        .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
        .get();
      expect(dbTorrentAfterDeletion).toBeUndefined();
    });

    it('should return an error if the torrent does not exist', async () => {
      const result = await torrentClient.deleteTorrent('nonexistentinfohash');
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Torrent not found');
    });

    it('should return an error if the db deletion fails', async () => {
      await torrentClient.addTorrent(dbTorrent, true);
      vi.mocked(fs.rmSync).mockThrowOnce(
        new Error("ENOENT: no such file or directory, stat '/nonexistent/path'"),
      );

      const result = await torrentClient.deleteTorrent(seededTorrent.infoHash);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Error while deleting torrent');
    });
  });

  describe('loadExistingTorrents', () => {
    it('should load an existing torrent from the database and add it to the client', async () => {
      await torrentClient.loadExistingTorrents();

      const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);
      expect(retrievedTorrent).not.toBeNull();
      expect(retrievedTorrent?.infoHash).toBe(seededTorrent.infoHash);
      expect(retrievedTorrent?.name).toBe('The.Movie.2026');
    });

    it('should fail gracefully if the torrent from the database cannot be added', async () => {
      vi.spyOn(torrentClient, 'addTorrent').mockRejectedValueOnce(
        new Error('Failed to add torrent'),
      );

      await expect(torrentClient.loadExistingTorrents()).resolves.not.toThrow();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Failed to load existing torrent',
        expect.objectContaining({
          error: expect.any(Error),
          infoHash: seededTorrent.infoHash,
          name: seededTorrent.name,
        }),
      );
    });

    describe('getStoreStats', () => {
      it('should return the stats of all torrents in the client', async () => {
        await torrentClient.addTorrent(dbTorrent, true);
        const stats = await torrentClient.getStoreStats();

        expect(stats.length).toBe(1);
        expect(stats[0].infoHash).toBe(seededTorrent.infoHash);
        expect(stats[0].name).toBe('The.Movie.2026');
      });
    });

    describe('deleteUnnecessaryTorrents', () => {
      const getSeedRequiredInfoHashesSpy = vi.spyOn(
        ncoreService,
        'getSeedRequiredNcoreInfoHashes',
      );

      it('should delete torrents that are no longer needed', async () => {
        const deleteTorrentSpy = vi.spyOn(torrentClient, 'deleteTorrent');
        await torrentClient.addTorrent(dbTorrent, true);
        getSeedRequiredInfoHashesSpy.mockResolvedValueOnce([]);

        await torrentClient.deleteUnnecessaryTorrents();

        const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);
        expect(retrievedTorrent).toBeNull();
        const dbTorrentAfterDeletion = db
          .select()
          .from(torrentsTable)
          .where(eq(torrentsTable.infoHash, dbTorrent.infoHash))
          .get();
        expect(dbTorrentAfterDeletion).toBeUndefined();

        expect(deleteTorrentSpy).toHaveBeenCalledWith(seededTorrent.infoHash);
        expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
          `Deleted unnecessary torrent: ${seededTorrent.name}`,
        );
      });

      it('should log an error if deleting a torrent fails', async () => {
        const deleteTorrentSpy = vi.spyOn(torrentClient, 'deleteTorrent');
        await torrentClient.addTorrent(dbTorrent, true);
        getSeedRequiredInfoHashesSpy.mockResolvedValueOnce([]);
        deleteTorrentSpy.mockResolvedValueOnce(new Error('Failed to delete torrent'));

        await torrentClient.deleteUnnecessaryTorrents();

        expect(deleteTorrentSpy).toHaveBeenCalledWith(seededTorrent.infoHash);
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
          `Failed to delete unnecessary torrent: ${seededTorrent.name}`,
          expect.objectContaining({
            infoHash: seededTorrent.infoHash,
            error: expect.any(Error),
          }),
        );
      });

      it('should keep torrents that are still needed', async () => {
        const deleteTorrentSpy = vi.spyOn(torrentClient, 'deleteTorrent');
        await torrentClient.addTorrent(dbTorrent, true);
        getSeedRequiredInfoHashesSpy.mockResolvedValueOnce([seededTorrent.infoHash]);

        await torrentClient.deleteUnnecessaryTorrents();

        const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);
        expect(retrievedTorrent).not.toBeNull();
        expect(retrievedTorrent?.infoHash).toBe(seededTorrent.infoHash);

        expect(deleteTorrentSpy).not.toHaveBeenCalled();
        expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
          `Keeping torrent: ${seededTorrent.name} (${seededTorrent.infoHash}) - not marked for deletion`,
        );
      });
    });
  });
});

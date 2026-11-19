import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { env } from '@server/env';
import { createMockFile, createSeededTorrent } from '@server/test-utils/torrent';
import { createTestUserWithSession } from '@server/test-utils/users';
import type { Torrent as WebtorrentTorrent } from 'webtorrent';

import { TorrentClient } from '../torrent.client';
import { insertNewTorrent } from '../torrent.db.utils';
import type { DbTorrent } from '../torrent.types';

describe('TorrentClient', async () => {
  let torrentClient: TorrentClient;
  let dbTorrent: DbTorrent;
  let tmpDir: string;

  const torrentName = 'The.Movie.2026';
  const file1Name = 'The.Movie.2026.1080p.WEBRip.x264.mkv';
  const file1Size = 1024 * 1024;
  const file1Path = `${torrentName}/${file1Name}`;
  const file2Name = 'The.Movie.2026.1080p.WEBRip.x264.srt';
  const file2Size = 1024 * 512;
  const file2Path = `${torrentName}/${file2Name}`;
  const files = [
    createMockFile(file1Path, file1Size),
    createMockFile(file2Path, file2Size),
  ];

  const {
    seededTorrent,
    peerAddress,
    cleanup: cleanupSeededTorrent,
  } = await createSeededTorrent(files);

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });
    env.DOWNLOADS_DIR = tmpDir;

    torrentClient = new TorrentClient(0);
    const { user } = await createTestUserWithSession();
    dbTorrent = insertNewTorrent({
      userId: user.id,
      imdbId: 'tt1234567',
      type: 'movie',
      torrentBuffer: Buffer.from(seededTorrent.torrentFile),
      torrentFileData: {
        infoHash: seededTorrent.infoHash,
        name: torrentName,
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
    it('adds a torrent and returns its WebTorrent files', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true, () => {});

      expect(torrent.infoHash).toBe(seededTorrent.infoHash);
      expect(torrent.name).toBe(torrentName);
      expect(torrent.files).toEqual([
        expect.objectContaining({ name: file1Name, length: file1Size, path: file1Path }),
        expect.objectContaining({ name: file2Name, length: file2Size, path: file2Path }),
      ]);
    });

    it('calls the verification callback when WebTorrent verifies the torrent', async () => {
      const onVerified = vi.fn<(torrent: WebtorrentTorrent) => void>();
      const torrent = await torrentClient.addTorrent(dbTorrent, true, onVerified);
      torrent.addPeer(peerAddress);

      const stream = torrent.files[0].stream({ start: 0, end: file1Size - 1 });
      for await (const _chunk of stream) {
        // Consume the stream to trigger verification.
      }

      await vi.waitFor(() => expect(onVerified).toHaveBeenCalledWith(torrent));
    });
  });

  describe('getTorrent', () => {
    it('returns an existing torrent', async () => {
      await torrentClient.addTorrent(dbTorrent, true, () => {});

      const retrievedTorrent = await torrentClient.getTorrent(seededTorrent.infoHash);

      expect(retrievedTorrent?.infoHash).toBe(seededTorrent.infoHash);
      expect(retrievedTorrent?.name).toBe(torrentName);
    });

    it('returns null when the torrent does not exist', async () => {
      const retrievedTorrent = await torrentClient.getTorrent('nonexistentinfohash');

      expect(retrievedTorrent).toBeNull();
    });

    it('waits for a pending torrent addition', async () => {
      const addPromise = torrentClient.addTorrent(dbTorrent, true, () => {});
      const getPromise = torrentClient.getTorrent(seededTorrent.infoHash);

      const [added, retrieved] = await Promise.all([addPromise, getPromise]);

      expect(retrieved).toBe(added);
    });
  });

  describe('streaming', () => {
    it('streams torrent content and saves the file to disk', async () => {
      const torrent = await torrentClient.addTorrent(dbTorrent, true, () => {});
      torrent.addPeer(peerAddress);

      const stream = torrent.files[0].stream({ start: 0, end: files[0].size - 1 });
      for await (const _chunk of stream) {
        // Consume the stream to trigger the download.
      }

      const downloadedPath = path.join(env.DOWNLOADS_DIR, file1Path);
      const expectedContent = Buffer.from(await files[0].arrayBuffer());

      expect(fs.readFileSync(downloadedPath)).toEqual(expectedContent);
    });

    it('preloads the rest of a file after its configured threshold is reached', async () => {
      env.PRELOAD_TORRENT_FILE_THRESHOLD = 0.5;
      const torrent = await torrentClient.addTorrent(dbTorrent, true, () => {});
      torrent.addPeer(peerAddress);

      const stream = torrent.files[0].stream({
        start: 0,
        end: Math.floor(files[0].size * 0.6) - 1,
      });
      for await (const _chunk of stream) {
        // Consume the stream so WebTorrent can apply the preload threshold.
      }

      await vi.waitFor(() => expect(torrent.files[0].progress).toBeCloseTo(1, 1));
    });

    it('preloads the rest of the torrent after its configured threshold is reached', async () => {
      env.PRELOAD_TORRENT_THRESHOLD = 0.5;
      const torrent = await torrentClient.addTorrent(dbTorrent, true, () => {});
      torrent.addPeer(peerAddress);

      const stream = torrent.files[0].stream({ start: 0, end: files[0].size - 1 });
      for await (const _chunk of stream) {
        // Consume the stream so WebTorrent can apply the preload threshold.
      }

      await vi.waitFor(() => expect(torrent.progress).toBe(1));
    });
  });
});

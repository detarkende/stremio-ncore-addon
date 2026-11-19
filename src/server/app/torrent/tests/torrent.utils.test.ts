import { StreamType } from '@server/app/stream/stream.constants';
import { db } from '@server/db';
import { usersTorrentsTable } from '@server/db/schema';
import mentalist from '@server/mocks/torrents/mentalist';
import { createTestUser } from '@server/test-utils/users';
import { and, eq } from 'drizzle-orm';

import { parseTorrentBuffer } from '../torrent-file.utils';
import { insertNewTorrent } from '../torrent.db.utils';
import { torrentStore } from '../torrent.store';
import type { Torrent } from '../torrent.types';
import { getOrAddTorrent } from '../torrent.utils';

describe('Torrent utils', () => {
  describe('insertNewTorrent', () => {
    it('inserts a new torrent and user-torrent record', async () => {
      const user = await createTestUser();
      const parsedTorrentData = await parseTorrentBuffer(mentalist.torrentBuffer);
      const torrent = insertNewTorrent({
        userId: user.id,
        imdbId: mentalist.imdbId,
        type: StreamType.TV_SHOW,
        torrentBuffer: mentalist.torrentBuffer,
        torrentFileData: parsedTorrentData,
      });

      expect(torrent).toHaveProperty('infoHash', parsedTorrentData.infoHash);
      expect(torrent.bitfield).toBeInstanceOf(Uint8Array);
      expect(torrent).toHaveProperty('imdbId', mentalist.imdbId);
      expect(torrent).toHaveProperty('name', parsedTorrentData.name);
      expect(torrent).toHaveProperty('type', StreamType.TV_SHOW);

      const userTorrentRecord = db
        .select()
        .from(usersTorrentsTable)
        .where(
          and(
            eq(usersTorrentsTable.userId, user.id),
            eq(usersTorrentsTable.torrentInfoHash, parsedTorrentData.infoHash),
          ),
        )
        .get();
      expect(userTorrentRecord).toBeDefined();
    });
  });

  describe('getOrAddTorrent', () => {
    it('records a viewer when returning an existing torrent and refreshes their watch time', async () => {
      const originalViewer = await createTestUser();
      const returningViewer = await createTestUser();
      const torrentFileData = await parseTorrentBuffer(mentalist.torrentBuffer);
      const existingTorrent: Torrent = {
        infoHash: torrentFileData.infoHash,
        name: torrentFileData.name,
        size: 0,
        progress: 0,
        downloaded: 0,
        path: '',
        files: [],
      };
      insertNewTorrent({
        userId: originalViewer.id,
        imdbId: mentalist.imdbId,
        type: StreamType.TV_SHOW,
        torrentBuffer: mentalist.torrentBuffer,
        torrentFileData,
      });
      vi.spyOn(torrentStore, 'getTorrent').mockResolvedValue(existingTorrent);
      const addTorrentSpy = vi.spyOn(torrentStore, 'addTorrent');
      const request = {
        userId: returningViewer.id,
        imdbId: mentalist.imdbId,
        type: StreamType.TV_SHOW,
        torrentSourceId: 'ncore-id',
        infoHash: torrentFileData.infoHash,
      };

      const returnedTorrent = await getOrAddTorrent(request);
      const viewerRecord = db
        .select()
        .from(usersTorrentsTable)
        .where(
          and(
            eq(usersTorrentsTable.userId, returningViewer.id),
            eq(usersTorrentsTable.torrentInfoHash, torrentFileData.infoHash),
          ),
        )
        .get();
      if (!viewerRecord) {
        throw new Error('Expected the returning viewer to be recorded');
      }

      db.update(usersTorrentsTable)
        .set({ updatedAt: new Date(0) })
        .where(
          and(
            eq(usersTorrentsTable.userId, returningViewer.id),
            eq(usersTorrentsTable.torrentInfoHash, torrentFileData.infoHash),
          ),
        )
        .run();

      await getOrAddTorrent(request);

      const refreshedRecord = db
        .select()
        .from(usersTorrentsTable)
        .where(
          and(
            eq(usersTorrentsTable.userId, returningViewer.id),
            eq(usersTorrentsTable.torrentInfoHash, torrentFileData.infoHash),
          ),
        )
        .get();

      expect(returnedTorrent).toBe(existingTorrent);
      expect(viewerRecord.userId).toBe(returningViewer.id);
      expect(refreshedRecord?.updatedAt.getTime()).toBeGreaterThan(0);
      expect(addTorrentSpy).not.toHaveBeenCalled();
    });
  });
});

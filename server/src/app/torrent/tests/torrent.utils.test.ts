import { createTestUser } from 'src/test-utils/users';
import mentalist from 'src/mocks/torrents/mentalist';
import { StreamType } from 'src/app/stream/stream.constants';
import { usersTorrentsTable } from 'src/db/schema/users_torrent_files';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/db';
import { parseTorrentBuffer } from '../torrent-file.utils';
import { insertNewTorrent, insertUserTorrentFileRecord } from '../torrent.utils';

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

  describe('insertUserTorrentFileRecord', () => {
    it('should insert a user-torrent file record', async () => {
      const user = await createTestUser();
      const parsedTorrentData = await parseTorrentBuffer(mentalist.torrentBuffer);

      insertNewTorrent({
        userId: user.id,
        imdbId: 'tt1234567',
        type: StreamType.TV_SHOW,
        torrentBuffer: mentalist.torrentBuffer,
        torrentFileData: parsedTorrentData,
      });

      insertUserTorrentFileRecord({
        userId: user.id,
        torrentInfoHash: parsedTorrentData.infoHash,
      });

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

    it('only tries to insert if record does not exist', async () => {
      const user = await createTestUser();
      const parsedTorrentData = await parseTorrentBuffer(mentalist.torrentBuffer);
      insertNewTorrent({
        userId: user.id,
        torrentBuffer: mentalist.torrentBuffer,
        imdbId: mentalist.imdbId,
        type: StreamType.TV_SHOW,
        torrentFileData: parsedTorrentData,
      });

      const insertSpy = vi.spyOn(db, 'insert');

      insertUserTorrentFileRecord({
        userId: user.id,
        torrentInfoHash: parsedTorrentData.infoHash,
      });

      expect(insertSpy).not.toHaveBeenCalled();
    });
  });
});

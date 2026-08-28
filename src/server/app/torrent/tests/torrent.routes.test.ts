import { SESSION_COOKIE_NAME } from '@server/app/auth/auth.constants';
import type { Torrent } from '@server/app/torrent/torrent.types';
import { UserRole } from '@server/app/user/user.types';
import { createTestUserWithSession } from '@server/test-utils/users';
import { testClient } from 'hono/testing';

import { torrentClient } from '../torrent.client';
import { torrentRoutes } from '../torrent.routes';

describe('Torrent routes', () => {
  const client = testClient(torrentRoutes);
  const torrents: Torrent[] = [
    {
      infoHash: 'info-hash',
      name: 'Example torrent',
      size: 1024,
      progress: 0.5,
      downloaded: 512,
      path: '/downloads/example-torrent',
      files: [],
    },
  ];

  describe('GET /api/torrents', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const getStoreStatsSpy = vi.spyOn(torrentClient, 'getStoreStats');

      const response = await client.api.torrents.$get({}, { headers: { Cookie: '' } });

      expect(response.status).toBe(401);
      expect(getStoreStatsSpy).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.USER });
      const getStoreStatsSpy = vi.spyOn(torrentClient, 'getStoreStats');

      const response = await client.api.torrents.$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(403);
      expect(getStoreStatsSpy).not.toHaveBeenCalled();
    });

    it('should return torrents for admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.ADMIN });
      const getStoreStatsSpy = vi
        .spyOn(torrentClient, 'getStoreStats')
        .mockResolvedValue(torrents);

      const response = await client.api.torrents.$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(torrents);
      expect(getStoreStatsSpy).toHaveBeenCalledOnce();
    });
  });

  describe('DELETE /api/torrents/:infoHash', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const deleteTorrentSpy = vi.spyOn(torrentClient, 'deleteTorrent');

      const response = await client.api.torrents[':infoHash'].$delete(
        { param: { infoHash: 'info-hash' } },
        { headers: { Cookie: '' } },
      );

      expect(response.status).toBe(401);
      expect(deleteTorrentSpy).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.USER });
      const deleteTorrentSpy = vi.spyOn(torrentClient, 'deleteTorrent');

      const response = await client.api.torrents[':infoHash'].$delete(
        { param: { infoHash: 'info-hash' } },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(403);
      expect(deleteTorrentSpy).not.toHaveBeenCalled();
    });

    it('should delete a torrent for admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.ADMIN });
      const deleteTorrentSpy = vi
        .spyOn(torrentClient, 'deleteTorrent')
        .mockResolvedValue(undefined);

      const response = await client.api.torrents[':infoHash'].$delete(
        { param: { infoHash: 'info-hash' } },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: 'Successfully deleted torrent.',
      });
      expect(deleteTorrentSpy).toHaveBeenCalledWith('info-hash');
    });

    it('should return 500 when deleting a torrent fails', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.ADMIN });
      vi.spyOn(torrentClient, 'deleteTorrent').mockResolvedValue(
        new Error('Torrent not found'),
      );

      const response = await client.api.torrents[':infoHash'].$delete(
        { param: { infoHash: 'info-hash' } },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ message: 'Torrent not found' });
    });
  });

  describe('DELETE /api/torrents/unnecessary', () => {
    it('should return the deletion results with failure messages for admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.ADMIN });
      const failedTorrent = { ...torrents[0], infoHash: 'failed-info-hash' };
      const deleteUnnecessaryTorrentsSpy = vi
        .spyOn(torrentClient, 'deleteUnnecessaryTorrents')
        .mockResolvedValue({
          deleted: torrents,
          failed: [{ torrent: failedTorrent, error: new Error('Torrent is locked') }],
        });

      const response = await client.api.torrents.unnecessary.$delete(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        deleted: torrents,
        failed: [
          {
            torrent: failedTorrent,
            error: { message: 'Torrent is locked' },
          },
        ],
      });
      expect(deleteUnnecessaryTorrentsSpy).toHaveBeenCalledOnce();
    });
  });
});

import { SESSION_COOKIE_NAME } from '@server/app/auth/auth.constants';
import type { Torrent, TorrentWithViewers } from '@server/app/torrent/torrent.types';
import { UserRole } from '@server/app/user/user.types';
import { createTestUserWithSession } from '@server/test-utils/users';
import { testClient } from 'hono/testing';

import { torrentRoutes } from '../torrent.routes';
import { torrentStore } from '../torrent.store';

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
  const torrentStats: TorrentWithViewers[] = [
    {
      infoHash: 'info-hash',
      name: 'Example torrent',
      size: 1024,
      progress: 0.5,
      downloaded: 512,
      path: '/downloads/example-torrent',
      files: [],
      viewers: [
        {
          userId: 1,
          username: 'testuser',
          firstWatchedAt: Date.now(),
          lastWatchedAt: Date.now(),
        },
      ],
    },
  ];

  describe('GET /api/torrents', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const getStoreStatsSpy = vi.spyOn(torrentStore, 'getStoreStats');

      const response = await client.api.torrents.$get({}, { headers: { Cookie: '' } });

      expect(response.status).toBe(401);
      expect(getStoreStatsSpy).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.USER });
      const getStoreStatsSpy = vi.spyOn(torrentStore, 'getStoreStats');

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
        .spyOn(torrentStore, 'getStoreStats')
        .mockResolvedValue(torrentStats);

      const response = await client.api.torrents.$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(torrentStats);
      expect(getStoreStatsSpy).toHaveBeenCalledOnce();
    });
  });

  describe('DELETE /api/torrents/:infoHash', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const deleteTorrentSpy = vi.spyOn(torrentStore, 'deleteTorrent');

      const response = await client.api.torrents[':infoHash'].$delete(
        { param: { infoHash: 'info-hash' } },
        { headers: { Cookie: '' } },
      );

      expect(response.status).toBe(401);
      expect(deleteTorrentSpy).not.toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', async () => {
      const { token } = await createTestUserWithSession({ role: UserRole.USER });
      const deleteTorrentSpy = vi.spyOn(torrentStore, 'deleteTorrent');

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
        .spyOn(torrentStore, 'deleteTorrent')
        .mockResolvedValue(null);

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
      vi.spyOn(torrentStore, 'deleteTorrent').mockResolvedValue(
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
        .spyOn(torrentStore, 'deleteUnnecessaryTorrents')
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

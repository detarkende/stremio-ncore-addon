import { HttpStatusCode } from '@server/types/http';
import { Hono } from 'hono';

import { useCookieAuth } from '../auth';
import { torrentClient } from './torrent.client';

export const torrentRoutes = new Hono()
  .basePath('/api')
  .get('/torrents', useCookieAuth('adminOnly'), async (c) => {
    const torrents = await torrentClient.getStoreStats();
    return c.json(torrents);
  })
  .get('/torrents/unnecessary', useCookieAuth('adminOnly'), async (c) => {
    const unnecessaryTorrents = await torrentClient.getUnnecessaryTorrents();
    return c.json(unnecessaryTorrents);
  })
  .delete('/torrents/unnecessary', useCookieAuth('adminOnly'), async (c) => {
    const results = await torrentClient.deleteUnnecessaryTorrents();
    const response = {
      deleted: results.deleted,
      failed: results.failed.map(({ torrent, error }) => ({
        torrent,
        error: { message: error.message },
      })),
    };
    return c.json(response, {
      status:
        results.failed.length > 0
          ? HttpStatusCode.INTERNAL_SERVER_ERROR
          : HttpStatusCode.OK,
    });
  })
  .delete('/torrents/:infoHash', useCookieAuth('adminOnly'), async (c) => {
    const { infoHash } = c.req.param();
    const deleteError = await torrentClient.deleteTorrent(infoHash);
    if (deleteError) {
      return c.json(
        { message: deleteError.message },
        { status: HttpStatusCode.INTERNAL_SERVER_ERROR },
      );
    }
    return c.json(
      { message: 'Successfully deleted torrent.' },
      { status: HttpStatusCode.OK },
    );
  });

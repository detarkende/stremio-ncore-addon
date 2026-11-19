import { HttpStatusCode } from '@server/types/http';
import { Hono } from 'hono';

import { useCookieAuth } from '../auth';
import { torrentStore } from './torrent.store';

export const torrentRoutes = new Hono()
  .basePath('/api')
  .get('/torrents', useCookieAuth('adminOnly'), async (c) => {
    const torrents = await torrentStore.getStoreStats();
    return c.json(torrents);
  })
  .get('/torrents/unnecessary', useCookieAuth('adminOnly'), async (c) => {
    const unnecessaryTorrents = await torrentStore.getUnnecessaryTorrents();
    return c.json(unnecessaryTorrents);
  })
  .delete('/torrents/unnecessary', useCookieAuth('adminOnly'), async (c) => {
    const results = await torrentStore.deleteUnnecessaryTorrents();
    const response = {
      deleted: results.deleted,
      failed: results.failed.map(({ torrent, error }) => ({
        torrent,
        error: { message: error.message },
      })),
    };
    return c.json(response);
  })
  .delete('/torrents/:infoHash', useCookieAuth('adminOnly'), async (c) => {
    const { infoHash } = c.req.param();
    let deleteError = await torrentStore.deleteTorrent(infoHash);
    if (deleteError) {
      return c.json(
        { message: deleteError.message, cause: deleteError.cause },
        { status: HttpStatusCode.INTERNAL_SERVER_ERROR },
      );
    }
    return c.json(
      { message: 'Successfully deleted torrent.' },
      { status: HttpStatusCode.OK },
    );
  });

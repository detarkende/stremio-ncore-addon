import { Hono } from 'hono';
import { HttpStatusCode } from 'src/types/http';

import { torrentClient } from './torrent.client';

export const torrentRoutes = new Hono()
  .basePath('/api')
  .get('/torrents', async (c) => {
    const torrents = await torrentClient.getStoreStats();
    return c.json(torrents);
  })
  .delete('/torrents/:infoHash', async (c) => {
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

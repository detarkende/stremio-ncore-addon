import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { TorrentStoreService } from '@/services/torrent-store';
import { HttpStatusCode } from '@/types/http';

export class TorrentController {
  constructor(private torrentStoreService: TorrentStoreService) {}
  public async getTorrentStats(c: Context) {
    const stats = await this.torrentStoreService.getStoreStats();
    return c.json(stats);
  }

  public async deleteTorrent(c: Context) {
    const { infoHash } = c.req.param();
    if (!infoHash) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: 'Bad Request',
        cause: 'Missing infohash in params',
      });
    }
    try {
      await this.torrentStoreService.deleteTorrent(infoHash);
      return c.json({ success: true, error: undefined });
    } catch (error) {
      return c.json({ success: false, error });
    }
  }
}

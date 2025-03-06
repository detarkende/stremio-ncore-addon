import { GetMetadataRequest, metadataQuerySchema } from '@/schemas/metadata.schema';
import { HttpStatusCode } from '@/types/http';
import { Context } from 'hono';
import { UserService } from '@/services/user';
import type { TorrentSource } from '@/services/torrent-source';
import { WatchHistoryService } from '@/services/watch-history';
import { env } from '@/env';
import { HTTPException } from 'hono/http-exception';
import { awaitAllReachablePromises } from '@/utils/promise-utils';
import { HonoEnv } from '@/types/hono-env';
import { TmdbService } from '@/services/catalog/tmdb.service';

export class MetadataService {
  private sources: TorrentSource[];

  constructor(
    sources: (TorrentSource | null)[],
    private userService: UserService,
    private watchHistoryService: WatchHistoryService,
    private tmdbService: TmdbService,
  ) {
    this.sources = sources.filter((source): source is TorrentSource => source !== null);
  }

  public async getMetadata(
    c: Context<HonoEnv, string, { out: { json: GetMetadataRequest } }>,
  ) {
    const params = c.req.param();
    const result = metadataQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { deviceToken, id, type } = result.data;

    const user = await this.userService.getUserByDeviceTokenOrThrow(deviceToken);

    if (id.startsWith('ncore:')) {
      const promises = this.sources.map(async (source) =>
        source.getMetadata(id.replace('ncore:', '').replace('.json', '')),
      );
      return c.json({ meta: (await awaitAllReachablePromises(promises))[0] });
    }
    if (id.startsWith('tt') && env.TMDB_API_KEY) {
      const imdbId = id.replace('.json', '');
      this.watchHistoryService.recordWatchHistory(user.id, type, imdbId);

      return c.json({
        meta: await this.tmdbService.findMetadataByImdbId(imdbId, user.preferredLanguage),
      });
    }
    return c.json({ meta: [] });
  }
}

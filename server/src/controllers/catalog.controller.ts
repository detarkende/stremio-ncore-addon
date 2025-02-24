import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { UserService } from '@/services/user';
import { HttpStatusCode } from '@/types/http';
import { CatalogService } from '@/services/catalog/catalog.service';
import {
  catalogQuerySchema,
  GetCatalogRequest,
  GetPlatformCatalogRequest,
  platformCatalogQuerySchema,
} from '@/schemas/catalogs.schema';
import { StreamType } from '@/schemas/stream.schema';
import { WatchHistoryService } from '@/services/watch-history';
import { awaitAllReachablePromises } from '@/utils/promise-utils';
import type { TorrentSource } from '@/services/torrent-source';
import { HonoEnv } from '@/types/hono-env';

export class CatalogController {
  private sources: TorrentSource[];

  constructor(
    sources: (TorrentSource | null)[],
    private userService: UserService,
    private catalogService: CatalogService,
    private watchHistoryService: WatchHistoryService,
  ) {
    this.sources = sources.filter((source): source is TorrentSource => source !== null);
  }

  public async getTrendingListByPlatform(
    c: Context<HonoEnv, string, { out: { json: GetPlatformCatalogRequest } }>,
  ) {
    const params = c.req.param();
    const result = platformCatalogQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { type, deviceToken, platform, values } = result.data;
    const parsedParams: Record<string, string> = {};

    if (values) {
      values.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) parsedParams[key] = value.replace('.json', '');
      });
    }

    const skip = parsedParams['skip'] ? parseInt(parsedParams['skip'], 10) : undefined;

    const user = await this.userService.getUserByDeviceTokenOrThrow(deviceToken);
    const { preferredLanguage } = user;

    const results = await this.catalogService.getTrendingListByPlatform(
      preferredLanguage,
      platform,
      type as StreamType,
      skip,
    );

    return c.json({ metas: results });
  }

  public async getRecommendationsByWatchHistory(
    c: Context<HonoEnv, string, { out: { json: GetCatalogRequest } }>,
  ) {
    const params = c.req.param();
    const result = catalogQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { type, deviceToken } = result.data;

    const user = await this.userService.getUserByDeviceTokenOrThrow(deviceToken);
    const { preferredLanguage } = user;

    const watchedImdbIds = await this.watchHistoryService.getLastWatchedByType(
      user.id,
      type,
    );

    const results = await this.catalogService.getRecommendationsByWatchHistory(
      preferredLanguage,
      watchedImdbIds,
    );

    return c.json({ metas: results });
  }

  public async getPageableTrendingTorrents(
    c: Context<HonoEnv, string, { out: { json: GetCatalogRequest } }>,
  ) {
    const params = c.req.param();
    const result = catalogQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { deviceToken, type, values } = result.data;

    const parsedParams: Record<string, string> = {};
    if (values) {
      values.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) parsedParams[key] = value.replace('.json', '');
      });
    }

    const genre = parsedParams['genre'] ? parsedParams['genre'] : undefined;
    const skip = parsedParams['skip'] ? parseInt(parsedParams['skip'], 10) : undefined;
    const search = parsedParams['search'] ? parsedParams['search'] : undefined;

    const user = await this.userService.getUserByDeviceTokenOrThrow(deviceToken);

    const { preferredLanguage } = user;
    const promises = this.sources.map(async (source) =>
      source.getPageableTrendingTorrents(type, preferredLanguage, skip, genre, search),
    );
    const results = (await awaitAllReachablePromises(promises)).flat();
    return c.json({ metas: results });
  }
}

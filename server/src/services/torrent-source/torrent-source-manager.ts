import { isNotNull } from '@/utils/type-guards';
import type { TorrentDetails, TorrentSource, TorrentSourceIssue } from './types';
import type { StreamQuery } from '@/schemas/stream.schema';
import { UserService } from '../user/user.service';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { catalogQuerySchema } from '@/schemas/catalogs.schema';
import { HttpStatusCode } from '@/types/http';
import { metadataQuerySchema } from '@/schemas/metadata.schema';

async function awaitAllReachablePromises<T>(promises: Promise<T>[]): Promise<T[]> {
  const awaitedResults: PromiseSettledResult<T>[] = await Promise.allSettled(promises);
  const successfulResults: PromiseFulfilledResult<T>[] = awaitedResults.filter(
    (promise): promise is PromiseFulfilledResult<T> => promise.status === 'fulfilled',
  );
  const failedResults: PromiseRejectedResult[] = awaitedResults.filter(
    (promise): promise is PromiseRejectedResult => promise.status === 'rejected',
  );
  failedResults.forEach(({ reason }) =>
    console.error(reason ?? 'Unknown error occurred.'),
  );
  return successfulResults.map(({ value }) => value);
}

export class TorrentSourceManager {
  private sources: TorrentSource[];
  constructor(
    sources: (TorrentSource | null)[],
    private userService: UserService,
  ) {
    this.sources = sources.filter((source): source is TorrentSource => source !== null);
  }

  public async getRemovableInfoHashes(): Promise<string[]> {
    const promises = this.sources.map(async (source) => source.getRemovableInfoHashes());
    const results = (await awaitAllReachablePromises(promises)).flat();
    return results;
  }

  public async getRecommended(c: Context) {
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
      source.getRecommended(type, preferredLanguage, skip, genre, search),
    );
    const results = (await awaitAllReachablePromises(promises)).flat();
    return c.json({ metas: results });
  }

  public async getMetadata(c: Context) {
    const params = c.req.param();
    const result = metadataQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { deviceToken, ncoreId } = result.data;

    await this.userService.getUserByDeviceTokenOrThrow(deviceToken);

    const promises = this.sources.map(async (source) =>
      source.getMetadata(ncoreId.replace('ncore:', '').replace('.json', '')),
    );
    const results = (await awaitAllReachablePromises(promises))[0];
    return c.json({ meta: results });
  }

  public async getTorrentUrlBySourceId({
    sourceId,
    sourceName,
  }: {
    sourceId: string;
    sourceName: string;
  }): Promise<string | null> {
    const source = this.sources.find((source) => source.name === sourceName);
    if (!source) {
      console.error(`Source ${sourceName} not found or not enabled.`);
      return null;
    }
    return source.getTorrentUrlBySourceId(sourceId);
  }

  public async getTorrentsForImdbId(
    params: Pick<StreamQuery, 'imdbId' | 'type' | 'season' | 'episode'>,
  ): Promise<TorrentDetails[]> {
    const promises = this.sources.map(async (source) =>
      source.getTorrentsForImdbId(params),
    );
    const results = (await awaitAllReachablePromises(promises)).flat();
    return results;
  }

  public async getSourceConfigIssues(): Promise<TorrentSourceIssue[]> {
    if (this.sources.length === 0) {
      return [
        {
          id: 'manager',
          sourceName: 'Torrent source manager',
          message: 'No torrent sources are configured.',
        },
      ];
    }
    const promises: Promise<TorrentSourceIssue | null>[] = this.sources.map(
      async (source) => {
        const issue = await source.getConfigIssues();
        if (!issue) {
          return null;
        }
        return {
          id: source.name,
          sourceName: source.displayName,
          message: issue,
        };
      },
    );
    const results = (await awaitAllReachablePromises(promises)).flat().filter(isNotNull);
    return results;
  }
}

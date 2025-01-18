import { isNotNull } from '@/utils/type-guards';
import type { TorrentDetails, TorrentSource, TorrentSourceIssue } from './types';
import type { StreamQuery } from '@/schemas/stream.schema';

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
  constructor(sources: (TorrentSource | null)[]) {
    this.sources = sources.filter((source): source is TorrentSource => source !== null);
  }

  public async getRemovableInfoHashes(): Promise<string[]> {
    const promises = this.sources.map(async (source) => source.getRemovableInfoHashes());
    const results = (await awaitAllReachablePromises(promises)).flat();
    return results;
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

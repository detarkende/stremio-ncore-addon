import type { TorrentDetails, TorrentSource, ITorrentSourceManager } from './types';
import type { StreamQuery } from '@/schemas/stream.schema';

async function awaitAllReachablePromises<T>(promises: Promise<T>[]): Promise<T[]> {
  const awaitedResults: PromiseSettledResult<T>[] = await Promise.allSettled(promises);
  const successfulResults: PromiseFulfilledResult<T>[] = awaitedResults.filter(
    (promise): promise is PromiseFulfilledResult<T> => promise.status === 'fulfilled',
  );
  return successfulResults.map(({ value }) => value);
}

export class TorrentSourceManager implements ITorrentSourceManager {
  constructor(private sources: TorrentSource[]) {}

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
    const source = this.sources.find((source) => source.torrentSourceName === sourceName);
    if (!source) {
      console.error(`Source ${sourceName} not found or not enabled.`);
      return null;
    }
    return source.getTorrentUrlBySourceId(sourceId);
  }

  public async getTorrentsForImdbId(
    params: Pick<StreamQuery, 'imdbId' | 'type'>,
  ): Promise<TorrentDetails[]> {
    const promises = this.sources.map(async (source) => source.getTorrentsForImdbId(params));
    const results = (await awaitAllReachablePromises(promises)).flat();
    return results;
  }
}

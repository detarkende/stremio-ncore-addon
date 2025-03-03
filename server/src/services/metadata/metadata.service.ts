import { GetMetadataRequest, metadataQuerySchema } from '@/schemas/metadata.schema';
import { HttpStatusCode } from '@/types/http';
import { Context } from 'hono';
import { UserService } from '@/services/user';
import type { TorrentSource } from '@/services/torrent-source';
import { WatchHistoryService } from '@/services/watch-history';
import { env } from '@/env';
import { Language } from '@/db/schema/users';
import { HTTPException } from 'hono/http-exception';
import { awaitAllReachablePromises } from '@/utils/promise-utils';
import { HonoEnv } from '@/types/hono-env';

export class MetadataService {
  private sources: TorrentSource[];

  constructor(
    sources: (TorrentSource | null)[],
    private userService: UserService,
    private watchHistoryService: WatchHistoryService,
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
      const results = (await awaitAllReachablePromises(promises))[0];
      return c.json({ meta: results });
    }
    if (id.startsWith('tt') && env.TMDB_API_KEY) {
      const imdbId = id.replace('.json', '');
      this.watchHistoryService.recordWatchHistory(user.id, type, imdbId);
      const result = await this.getMetadataForIMDBId(imdbId, user.preferredLanguage);
      return c.json({ meta: result });
    }
    return c.json({ meta: [] });
  }

  private async getMetadataForIMDBId(imdbId: string, preferredLanguage: string) {
    const tmdbApiKey = env.TMDB_API_KEY;
    const userLanguage = preferredLanguage === Language.HU ? 'hu-HU' : 'en-US';

    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApiKey}&language=${userLanguage}&external_source=imdb_id`,
    );
    const details = await response.json();
    const firstResult = details.movie_results[0] || details.tv_results[0];
    if (!firstResult || !firstResult.id || !firstResult.media_type) return null;

    const localizedResponse = await fetch(
      `https://api.themoviedb.org/3/${firstResult.media_type}/${firstResult.id}?api_key=${tmdbApiKey}&language=${userLanguage}&append_to_response=external_ids`,
    );
    const localizedDetails = await localizedResponse.json();

    const commonData = {
      id: localizedDetails.external_ids.imdb_id,
      name: localizedDetails.title || localizedDetails.name,
      genre: [],
      poster: `https://image.tmdb.org/t/p/w500${localizedDetails.poster_path}`,
      background: `https://image.tmdb.org/t/p/original${localizedDetails.backdrop_path}`,
      imdbRating: localizedDetails.vote_average,
      posterShape: 'regular',
      year: (
        localizedDetails.release_date ||
        localizedDetails.first_air_date ||
        ''
      ).split('-')[0],
      description: localizedDetails.overview,
      logo: `https://images.metahub.space/logo/medium/${localizedDetails.external_ids.imdb_id}/img`,
    };

    if (firstResult.media_type === 'tv') {
      const seasons = this.generateSeasonsString(localizedDetails.seasons).join(',');
      const responseWithSeasons = await fetch(
        `https://api.themoviedb.org/3/${firstResult.media_type}/${localizedDetails.id}?api_key=${tmdbApiKey}&language=${userLanguage}&append_to_response=external_ids,${seasons}`,
      );
      const response = await responseWithSeasons.json();
      const episodes = await this.getEpisodes(response);
      return { ...commonData, type: 'series', videos: episodes };
    } else {
      return { ...commonData, type: 'movie' };
    }
  }

  private generateSeasonsString(seasons: any[]) {
    const chunkSize = 20;
    const chunks = [];

    for (let i = 0; i < seasons.length; i += chunkSize) {
      const chunk = seasons
        .slice(i, i + chunkSize)
        .map((season) => `season/${season.season_number}`)
        .join(',');
      chunks.push(chunk);
    }

    return chunks;
  }

  private getEpisodes(data: any) {
    const seasons = data.seasons;
    const seasonStrings = this.generateSeasonsString(seasons);
    const episodes: any[] = [];

    for (const seasonString of seasonStrings) {
      const splitSeasons = seasonString.split(',');

      for (const season of splitSeasons) {
        if (data[season]) {
          for (const [index, episode] of data[season].episodes.entries()) {
            episodes.push({
              id: `${data.external_ids.imdb_id}:${episode.season_number}:${index + 1}`,
              name: episode.name,
              season: episode.season_number,
              number: index + 1,
              episode: index + 1,
              thumbnail: `https://image.tmdb.org/t/p/w500${episode.still_path}`,
              overview: episode.overview,
              description: episode.overview,
              rating: episode.vote_average.toString(),
              released: new Date(Date.parse(episode.air_date) + episode.season_number),
            });
          }
        }
      }
    }

    return episodes;
  }
}

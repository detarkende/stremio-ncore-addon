import {
  ExternalId,
  FindResponse,
  MovieDb,
  MovieRecommendationsResponse,
  PersonResult,
  SearchMultiResponse,
  TvResult,
  TvResultsResponse,
  MovieResult,
  TvSeasonResponse,
  SimpleSeason,
} from 'moviedb-promise';
import { Language } from '@/db/schema/users';
import {
  DetailedMetadata,
  EpisodeMetadata,
  ExtendedMovieResponse,
  ExtendedShowResponse,
  SimpleMetadata,
} from '@/services/metadata/types';

export class TmdbService {
  private tmdb: MovieDb;

  constructor(tmdbApiKey: string) {
    this.tmdb = new MovieDb(tmdbApiKey);
  }

  public async findMetadataByImdbId(
    imdbId: string,
    language: string,
  ): Promise<DetailedMetadata | null> {
    try {
      const response = await this.findByImdbId(imdbId);
      const result: MovieResult | TvResult =
        response.movie_results[0] || response.tv_results[0];

      if (result) {
        const tmdbId = result.id!;
        return await this.getMetadataByTmdbId(tmdbId, language, result.media_type);
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from TMDB:', error);
      throw new Error('Could not fetch data from TMDB');
    }
  }

  public async findSimpleMetadataByImdbId(
    imdbId: string,
    language: string,
  ): Promise<SimpleMetadata | null> {
    try {
      const response = await this.findByImdbId(imdbId);
      const result: MovieResult | TvResult =
        response.movie_results[0] || response.tv_results[0];

      if (result) {
        const tmdbId = result.id!;
        return await this.getSimpleMetadataByTmdbId(tmdbId, language, result.media_type);
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from TMDB:', error);
      throw new Error('Could not fetch data from TMDB');
    }
  }

  public async findRecommendedByImdbId(
    imdbId: string,
    language: string,
  ): Promise<SimpleMetadata[] | null> {
    try {
      const response: FindResponse = await this.findByImdbId(imdbId);
      const result: MovieResult | TvResult =
        response.movie_results[0] || response.tv_results[0];

      if (result) {
        const tmdbId = result.id!;
        const recommended: MovieResult[] | TvResult[] | null = await this.findRecommended(
          tmdbId,
          language,
          result.media_type,
        );
        if (recommended) {
          const results = await Promise.all(
            recommended.map(async (item: MovieResult | TvResult) => {
              return await this.getSimpleMetadataByTmdbId(
                item.id!,
                language,
                item.media_type,
              );
            }),
          );
          return results.filter(
            (item: SimpleMetadata) =>
              item.description &&
              item.description !== '' &&
              (language !== Language.HU || /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(item.description)),
          );
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from TMDB:', error);
      throw new Error('Could not fetch data from TMDB');
    }
  }

  public async searchTMDb(
    title: string,
    language: string,
  ): Promise<SimpleMetadata | null> {
    try {
      const response: SearchMultiResponse = await this.tmdb.searchMulti({ query: title });

      if (response.results) {
        const preferredResult: MovieResult | TvResult | PersonResult =
          response.results.sort(
            (
              a: { title?: string; name?: string; popularity?: number },
              b: { title?: string; name?: string; popularity?: number },
            ) => {
              const aTitle = a.title || a.name || '';
              const bTitle = b.title || b.name || '';

              if (aTitle === title && bTitle !== title) return -1;
              if (aTitle !== title && bTitle === title) return 1;
              if (aTitle === title && bTitle === title)
                return (b.popularity ?? 0) - (a.popularity ?? 0);
              return (b.popularity ?? 0) - (a.popularity ?? 0);
            },
          )[0];

        if (preferredResult) {
          const tmdbId = preferredResult.id!;
          return await this.getSimpleMetadataByTmdbId(
            tmdbId,
            language,
            preferredResult.media_type,
          );
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching data from TMDB:', error);
      throw new Error('Could not fetch data from TMDB');
    }
  }

  private async findByImdbId(imdbId: string): Promise<FindResponse> {
    return await this.tmdb.find({ id: imdbId, external_source: ExternalId.ImdbId });
  }

  public async findRecommended(
    tmdbId: number,
    language: string,
    mediaType: string,
  ): Promise<MovieResult[] | TvResult[] | null> {
    try {
      const response: MovieRecommendationsResponse | TvResultsResponse =
        mediaType === 'movie'
          ? await this.tmdb.movieRecommendations({ id: tmdbId, language })
          : await this.tmdb.tvRecommendations({ id: tmdbId, language });

      if (response.results) {
        const results = response.results.slice(0, 5);
        return mediaType === 'movie'
          ? (results as MovieResult[])
          : (results as TvResult[]);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching data from TMDB:', error);
      throw new Error('Could not fetch data from TMDB');
    }
  }

  private async getSimpleMetadataByTmdbId(
    tmdbId: number,
    language: string,
    mediaType: string,
  ): Promise<SimpleMetadata> {
    const append_to_response = 'videos,credits,external_ids';

    const response: ExtendedMovieResponse | ExtendedShowResponse =
      mediaType === 'movie'
        ? ((await this.tmdb.movieInfo({
            id: tmdbId,
            language,
            append_to_response,
          })) as ExtendedMovieResponse)
        : ((await this.tmdb.tvInfo({
            id: tmdbId,
            language,
            append_to_response,
          })) as ExtendedShowResponse);

    const imdbId = response.external_ids!.imdb_id!;
    const commonMetadata = {
      id: imdbId,
      description: response.overview ?? '',
      genre: response.genres?.map((item) => item.name!) ?? [''],
      imdbRating: `${response.vote_average}`,
      background: `https://image.tmdb.org/t/p/original${response.backdrop_path}`,
      poster: `https://image.tmdb.org/t/p/w500${response.poster_path}`,
    };

    if (mediaType === 'movie') {
      const movieResponse: ExtendedMovieResponse = response as ExtendedMovieResponse;
      return {
        ...commonMetadata,
        name: movieResponse.title ?? '',
        type: 'movie',
        year: movieResponse.release_date?.substring(0, 4) ?? '',
      };
    } else {
      const tvResponse: ExtendedShowResponse = response as ExtendedShowResponse;
      return {
        ...commonMetadata,
        name: tvResponse.name ?? '',
        type: 'series',
        year:
          tvResponse.status === 'Ended'
            ? `${tvResponse.first_air_date?.substring(0, 4)}-${tvResponse.last_air_date?.substring(0, 4)}`
            : `${tvResponse.first_air_date?.substring(0, 4)}-`,
      };
    }
  }

  private async getMetadataByTmdbId(
    tmdbId: number,
    language: string,
    mediaType: string,
  ): Promise<DetailedMetadata> {
    const append_to_response = 'videos,credits,external_ids';

    const response: ExtendedMovieResponse | ExtendedShowResponse =
      mediaType === 'movie'
        ? ((await this.tmdb.movieInfo({
            id: tmdbId,
            language,
            append_to_response,
          })) as ExtendedMovieResponse)
        : ((await this.tmdb.tvInfo({
            id: tmdbId,
            language,
            append_to_response,
          })) as ExtendedShowResponse);

    const imdbId = response.external_ids!.imdb_id!;
    const commonMetadata: SimpleMetadata = {
      id: imdbId,
      description: response.overview ?? '',
      genre: response.genres?.map((item) => item.name!) || [''],
      imdbRating: `${response.vote_average}`,
      background: `https://image.tmdb.org/t/p/original${response.backdrop_path}`,
      poster: `https://image.tmdb.org/t/p/w500${response.poster_path}`,
      type: '',
      name: '',
      year: '',
    };

    if (mediaType === 'movie') {
      const movieResponse: ExtendedMovieResponse = response as ExtendedMovieResponse;
      return {
        ...commonMetadata,
        imdb_id: imdbId,
        cast: movieResponse.credits!.cast?.slice(0, 4).map((item) => item.name),
        country: movieResponse.production_countries
          ?.map((country) => country.name)
          .join(', '),
        trailers: movieResponse
          .videos!.results?.filter(
            (item) => item.site === 'YouTube' && item.type === 'Trailer',
          )
          .map((item) => ({ source: item.key, type: item.type })),
        trailerStreams: movieResponse
          .videos!.results?.filter(
            (item) => item.site === 'YouTube' && item.type === 'Trailer',
          )
          .map((item) => ({ title: item.name, ytId: item.key })),
        logo: `https://images.metahub.space/logo/medium/${imdbId}/img`,
        name: movieResponse.title,
        released: new Date(movieResponse.release_date!),
        slug: `movie/${movieResponse.title!.toLowerCase().replace(/ /g, '-')}-${imdbId?.replace('tt', '')}`,
        type: 'movie',
        writer: movieResponse
          .credits!.crew?.filter((item) => item.job === 'Writer')
          .map((item) => item.name),
        year: movieResponse.release_date?.substring(0, 4),
        director: movieResponse
          .credits!.crew?.filter((item) => item.job === 'Director')
          .map((item) => item.name),
        runtime: movieResponse.runtime,
        releaseInfo: movieResponse.release_date?.substring(0, 4),
        links: [
          {
            name: movieResponse.vote_average,
            category: 'imdb',
            url: `https://imdb.com/title/${imdbId}`,
          },
          {
            name: movieResponse.title,
            category: 'share',
            url: `https://www.strem.io/s/movie/${movieResponse.title!.toLowerCase().replace(/ /g, '-')}-${imdbId?.replace('tt', '')}`,
          },
          ...(movieResponse.credits!.cast?.slice(0, 4).map((actor) => ({
            name: actor,
            category: 'Cast',
            url: `stremio:///search?search=${encodeURIComponent(actor.toString())}`,
          })) ?? ''),
          ...(movieResponse
            .credits!.crew?.filter((item) => item.job === 'Director')
            .map((director) => ({
              name: director,
              category: 'Directors',
              url: `stremio:///search?search=${encodeURIComponent(director.toString())}`,
            })) ?? ''),
          ...(movieResponse
            .credits!.crew?.filter((item) => item.job === 'Writer')
            .map((writer) => ({
              name: writer,
              category: 'Writers',
              url: `stremio:///search?search=${encodeURIComponent(writer.toString())}`,
            })) ?? ''),
        ],
        behaviorHints: {
          defaultVideoId: imdbId,
          hasScheduledVideos: true,
        },
        videos: [
          {
            id: imdbId,
            title: '',
            released: movieResponse.release_date
              ? new Date(movieResponse.release_date).toISOString()
              : '',
          },
        ],
      } as DetailedMetadata;
    } else {
      const tvResponse: ExtendedShowResponse = response as ExtendedShowResponse;

      const showMetadata = {
        ...commonMetadata,
        imdb_id: imdbId,
        cast: tvResponse.credits!.cast?.slice(0, 4).map((item) => item.name),
        country: tvResponse.production_countries
          ?.map((country) => country.name)
          .join(', '),
        trailers: tvResponse
          .videos!.results?.filter(
            (item) => item.site === 'YouTube' && item.type === 'Trailer',
          )
          .map((item) => ({ source: item.key, type: item.type })),
        logo: `https://images.metahub.space/logo/medium/${imdbId}/img`,
        name: tvResponse.name,
        released: new Date(tvResponse.first_air_date!),
        slug: `series/${tvResponse.name!.toLowerCase().replace(/ /g, '-')}-${imdbId?.replace('tt', '')}`,
        type: 'series',
        writer: tvResponse.created_by!.map((item) => item.name),
        year:
          tvResponse.status === 'Ended'
            ? `${tvResponse.first_air_date?.substring(0, 4)}-${tvResponse.last_air_date?.substring(0, 4)}`
            : `${tvResponse.first_air_date?.substring(0, 4)}-`,
        runtime: `${tvResponse.episode_run_time ? tvResponse.episode_run_time[0] : ''}`,
        releaseInfo:
          tvResponse.status === 'Ended'
            ? `${tvResponse.first_air_date?.substring(0, 4)}-${tvResponse.last_air_date?.substring(0, 4)}`
            : `${tvResponse.first_air_date?.substring(0, 4)}-`,
        trailerStreams:
          tvResponse
            .videos!.results?.filter(
              (item) => item.site === 'YouTube' && item.type === 'Trailer',
            )
            .map((item) => ({ title: item.name, ytId: item.key })) ?? '',
        links: [
          {
            name: tvResponse.vote_average,
            category: 'imdb',
            url: `https://imdb.com/title/${imdbId}`,
          },
          {
            name: tvResponse.name,
            category: 'share',
            url: `https://www.strem.io/s/series/${tvResponse.name!.toLowerCase().replace(/ /g, '-')}-${imdbId?.replace('tt', '')}`,
          },
          ...(tvResponse.credits!.cast?.slice(0, 4).map((actor) => ({
            name: actor,
            category: 'Cast',
            url: `stremio:///search?search=${encodeURIComponent(actor.toString())}`,
          })) ?? ''),
          ...(tvResponse
            .credits!.crew?.filter((item) => item.job === 'Director')
            .map((director) => ({
              name: director,
              category: 'Directors',
              url: `stremio:///search?search=${encodeURIComponent(director.toString())}`,
            })) ?? ''),
          ...(tvResponse
            .credits!.crew?.filter((item) => item.job === 'Writer')
            .map((writer) => ({
              name: writer,
              category: 'Writers',
              url: `stremio:///search?search=${encodeURIComponent(writer.toString())}`,
            })) ?? ''),
        ],
        behaviorHints: {
          defaultVideoId: null,
          hasScheduledVideos: true,
        },
        videos: [
          {
            id: imdbId,
            title: '',
            released: tvResponse.first_air_date
              ? new Date(tvResponse.first_air_date).toISOString()
              : '',
          },
        ],
      } as DetailedMetadata;

      const seasons = this.generateSeasonsString(tvResponse.seasons!);
      const responseWithEpisodes: ExtendedShowResponse = (await this.tmdb.tvInfo({
        id: tmdbId,
        language,
        append_to_response: seasons.join(','),
      })) as ExtendedShowResponse;

      const episodes: EpisodeMetadata[] = [];

      for (const seasonString of this.generateSeasonsString(
        responseWithEpisodes.seasons ?? [],
      )) {
        const splitSeasons = seasonString.split(',');

        for (const season of splitSeasons) {
          const seasonData = responseWithEpisodes[
            season as keyof ExtendedShowResponse
          ] as TvSeasonResponse;
          if (seasonData) {
            for (const [index, episode] of seasonData.episodes!.entries()) {
              episodes.push({
                id: `${tvResponse.external_ids!.imdb_id!}:${episode.season_number!}:${index + 1}`,
                name: episode.name!,
                season: episode.season_number!,
                number: index + 1,
                episode: index + 1,
                overview: episode.overview ?? '',
                description: episode.overview ?? '',
                rating: `${episode.vote_average}`,
                released: new Date(
                  Date.parse(episode.air_date!) + episode.season_number!,
                ),
              });
            }
          }
        }
      }

      showMetadata.videos = episodes;

      return showMetadata;
    }
  }

  private generateSeasonsString(seasons: SimpleSeason[]) {
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
}

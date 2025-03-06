import {
  CreditsResponse,
  MovieResponse,
  ShowResponse,
  SimpleSeason,
  TvSeasonResponse,
  VideosResponse,
  SimpleEpisode,
} from 'moviedb-promise';
import {
  MovieExternalIdsResponse,
  TvExternalIdsResponse,
} from 'moviedb-promise/dist/request-types';

export interface SimpleMetadata {
  id: string;
  name: string;
  description: string;
  genre: string[];
  imdbRating: string;
  background: string;
  poster: string;
  year: string;
  type: string;
}

export interface DetailedMetadata extends SimpleMetadata {
  imdb_id?: string;
  cast?: string[];
  country?: string;
  trailers?: { source: string; type: string }[];
  trailerStreams?: { title: string; ytId: string }[];
  logo?: string;
  released?: Date;
  slug?: string;
  writer?: string[];
  runtime?: string;
  releaseInfo?: string;
  links?: { name: string; category: string; url: string }[];
  behaviorHints?: { defaultVideoId: string | null; hasScheduledVideos: boolean };
  videos?: EpisodeMetadata[];
  director?: string[];
}

export interface EpisodeMetadata {
  id: string;
  name: string;
  season: number;
  number: number;
  episode: number;
  overview: string;
  description: string;
  rating: string;
  released: Date;
  thumbnail: string;
}

export type ExtendedMovieResponse = MovieResponse & {
  external_ids: MovieExternalIdsResponse;
  credits: CreditsResponse;
  videos: VideosResponse;
};
export type ExtendedShowResponse = ShowResponse & {
  external_ids: TvExternalIdsResponse;
  credits: CreditsResponse;
  videos: VideosResponse;
  seasons: SimpleSeason[] | TvSeasonResponse;
  last_episode_to_air: DetailedEpisode;
  next_episode_to_air: DetailedEpisode;
};
export interface DetailedEpisode extends SimpleEpisode {
  runtime?: string;
}

import type { TorrentCategory } from './constants';

export type NcoreTorrent = {
  torrent_id: string;
  category: TorrentCategory;
  release_name: string;
  details_url: string;
  download_url: string;
  freeleech: boolean;
  imdb_id: string;
  imdb_rating: number;
  size: `${number}`;
  type: 'movie' | 'show';
  leechers: `${number}`;
  seeders: number;
};

export type NcorePageResponseJson = {
  results: NcoreTorrent[];
  total_results: `${number}`;
  onpage: number;
  perpage: `${number}`;
};

export enum NcoreSearchBy {
  NAME = 'name',
  DESCRIPTION = 'leiras',
  IMDB = 'imdb',
  TAGS = 'cimke',
}

export enum NcoreOrderBy {
  NAME = 'name',
  CREATION_TIME = 'ctime',
  SEEDERS = 'seeders',
  TIMES_COMPLETED = 'times_completed',
  SIZE = 'size',
  LEECHERS = 'leechers',
}

export enum NcoreOrderDirection {
  DESC = 'DESC',
  ASC = 'ASC',
}

export type NcoreQueryParams = {
  mire: string;
  miben: NcoreSearchBy;
  miszerint: NcoreOrderBy;
  hogyan?: NcoreOrderDirection;
  kivalasztott_tipus: string;
};

export type Metadata = {
  id: string;
  name: string;
  poster: string;
  background: string;
  year: string;
  type: string;
  description: string;
  director: string;
  cast: string;
  runtime: string;
  genre: string[];
  imdbRating: string;
  posterShape: string;
};

export type TorrentMetadata = {
  torrentUrl: string;
  torrentCategory: TorrentCategory;
  detailsUrl: string;
  seeders: number;
  size: number;
  leechers: number;
};

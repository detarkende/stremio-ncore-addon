import type { TorrentCategory } from './ncore.constants';

export type NcoreTorrent = {
  torrent_id: string;
  category: TorrentCategory;
  release_name: string;
  details_url: string;
  download_url: string;
  freeleech: boolean;
  imdb_id: string;
  imdb_rating: string;
  size: `${number}`;
  type: 'movie' | 'show';
  leechers: `${number}`;
  seeders: `${number}`;
};

export type NcorePageResponseJson = {
  results: NcoreTorrent[];
  total_results: `${number}`;
  onpage: number;
  perpage: `${number}`;
};

export const NcoreSearchBy = {
  NAME: 'name',
  DESCRIPTION: 'leiras',
  IMDB: 'imdb',
  TAGS: 'cimke',
} as const;
export type NcoreSearchBy = (typeof NcoreSearchBy)[keyof typeof NcoreSearchBy];

export const NcoreOrderBy = {
  NAME: 'name',
  CREATION_TIME: 'ctime',
  SEEDERS: 'seeders',
  TIMES_COMPLETED: 'times_completed',
  SIZE: 'size',
  LEECHERS: 'leechers',
} as const;
export type NcoreOrderBy = (typeof NcoreOrderBy)[keyof typeof NcoreOrderBy];

export const NcoreOrderDirection = {
  DESC: 'DESC',
  ASC: 'ASC',
} as const;
export type NcoreOrderDirection =
  (typeof NcoreOrderDirection)[keyof typeof NcoreOrderDirection];

export type NcoreQueryParams = {
  mire: string;
  miben: NcoreSearchBy;
  miszerint: NcoreOrderBy;
  hogyan?: NcoreOrderDirection;
  kivalasztott_tipus: string;
};

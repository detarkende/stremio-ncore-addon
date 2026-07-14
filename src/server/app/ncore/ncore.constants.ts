export const NcoreResolution = {
  SD: 'xvid',
  DVD: 'dvd',
  DVD9: 'dvd9',
  HD: 'hd',
} as const;
export type NcoreResolution = (typeof NcoreResolution)[keyof typeof NcoreResolution];

export const MovieCategory = {
  SD_HUN: 'xvid_hun',
  SD: 'xvid',
  DVD_HUN: 'dvd_hun',
  DVD: 'dvd',
  DVD9_HUN: 'dvd9_hun',
  DVD9: 'dvd9',
  HD_HUN: 'hd_hun',
  HD: 'hd',
} as const;
export type MovieCategory = (typeof MovieCategory)[keyof typeof MovieCategory];

export const SeriesCategory = {
  SD_HUN: 'xvidser_hun',
  SD: 'xvidser',
  DVD_HUN: 'dvdser_hun',
  DVD: 'dvdser',
  HD_HUN: 'hdser_hun',
  HD: 'hdser',
} as const;
export type SeriesCategory = (typeof SeriesCategory)[keyof typeof SeriesCategory];

export const MOVIE_CATEGORY_FILTERS = Object.values(MovieCategory).join(',');
export const SERIES_CATEGORY_FILTERS = Object.values(SeriesCategory).join(',');

export const BATCH_SIZE = 15;
export const BATCH_DELAY = 200;

export type TorrentCategory = MovieCategory | SeriesCategory;

export const HUNGARIAN_CATEGORIES: TorrentCategory[] = [
  MovieCategory.SD_HUN,
  MovieCategory.DVD_HUN,
  MovieCategory.DVD9_HUN,
  MovieCategory.HD_HUN,
  SeriesCategory.SD_HUN,
  SeriesCategory.DVD_HUN,
  SeriesCategory.HD_HUN,
];

export const ncoreResolutionLabels: Record<NcoreResolution, string> = {
  [NcoreResolution.SD]: 'SD',
  [NcoreResolution.DVD]: 'DVD',
  [NcoreResolution.DVD9]: 'DVD9',
  [NcoreResolution.HD]: 'HD',
};

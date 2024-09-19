import type { NcoreQueryParams } from './types';

export enum NcoreResolution {
	SD = 'xvid',
	DVD = 'dvd',
	DVD9 = 'dvd9',
	HD = 'hd',
}

export enum MovieCategory {
	SD_HUN = 'xvid_hun',
	SD = 'xvid',
	DVD_HUN = 'dvd_hun',
	DVD = 'dvd',
	DVD9_HUN = 'dvd9_hun',
	DVD9 = 'dvd9',
	HD_HUN = 'hd_hun',
	HD = 'hd',
}

export enum SeriesCategory {
	SD_HUN = 'xvidser_hun',
	SD = 'xvidser',
	DVD_HUN = 'dvdser_hun',
	DVD = 'dvdser',
	HD_HUN = 'hdser_hun',
	HD = 'hdser',
}

export const MOVIE_CATEGORY_FILTERS = Object.values(MovieCategory).join(',');
export const SERIES_CATEGORY_FILTERS = Object.values(SeriesCategory).join(',');

export const BATCH_SIZE = 15;
export const BATCH_DELAY = 200;

export type TorrentCategory = MovieCategory | SeriesCategory;

export const defaultNcoreQueryParams: Omit<NcoreQueryParams, 'mire' | 'kivalasztott_tipus'> = {
	jsons: 'true',
	miben: 'name',
	miszerint: 'ctime',
	hogyan: 'DESC',
	tipus: 'kivalasztottak_kozott',
};

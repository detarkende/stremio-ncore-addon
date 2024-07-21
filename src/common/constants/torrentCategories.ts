export const MOVIE_CATEGORIES = [
	'xvid_hun',
	'xvid',
	'dvd_hun',
	'dvd',
	'dvd9_hun',
	'dvd9',
	'hd_hun',
	'hd',
] as const;
export const SERIES_CATEGORIES = [
	'xvidser_hun',
	'xvidser',
	'dvdser_hun',
	'dvdser',
	'hdser_hun',
	'hdser',
] as const;

export type TorrentCategory = (typeof MOVIE_CATEGORIES | typeof SERIES_CATEGORIES)[number];

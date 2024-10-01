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
	seeders: `${number}`;
};

export type NcorePageResponseJson = {
	results: NcoreTorrent[];
	total_results: `${number}`;
	onpage: number;
	perpage: `${number}`;
};

export type NcoreQueryParams = {
	mire: string;
	miben: 'name' | 'leiras' | 'imdb' | 'cimke';
	miszerint: 'name' | 'ctime' | 'seeders' | 'times_completed' | 'size' | 'leechers';
	hogyan?: 'DESC' | 'ASC';
	tipus: 'kivalasztottak_kozott';
	kivalasztott_tipus: string;
	jsons: 'true';
};

import type { Language, Resolution } from '@ctrl/video-filename-parser';
import { login } from './login';
import { downloadAndParseTorrent } from './downloadAndParseTorrent';
import { config } from '@/common/config/config';
import {
	MOVIE_CATEGORIES,
	SERIES_CATEGORIES,
	type TorrentCategory,
} from '@/common/constants/torrentCategories';
import { findTorrentFileIdx } from '@/torrent/findTorrentFileIdx';
import { isSupportedMedia } from '@/common/constants/mediaExtensions';
import { memoize } from '@/common/helpers/memoize';
import { processInBatches } from '@/common/helpers/processInBatches';
import { BATCH_DELAY, BATCH_SIZE } from '@/common/constants/batches';

const MOVIE_CATEGORY_FILTERS = MOVIE_CATEGORIES.join(',');
const SERIES_CATEGORY_FILTERS = SERIES_CATEGORIES.join(',');

// The torrent shape from the ncore json api
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
// The response shape from the ncore json api (with pagination details)
type NcorePageResponseJson = {
	results: NcoreTorrent[];
	total_results: `${number}`;
	onpage: number;
	perpage: `${number}`;
};

// The data that we use from the torrent file
export type ParsedDataFromTorrentFile = {
	infoHash: string;
	files: {
		name: string;
		path: string;
		length: number;
		offset: number;
	}[];
};

// The full torrent shape that we use in the addon
export type FullTorrent = NcoreTorrent &
	ParsedDataFromTorrentFile & {
		resolution: Resolution;
		languages: Language[];
		selectedFileIdx: number;
	};

const fetchTorrents = async (query: URLSearchParams): Promise<NcorePageResponseJson> => {
	const cookies = await login(config.NCORE_USERNAME, config.NCORE_PASSWORD);
	const request = await fetch(`${config.NCORE_URL}/torrents.php?${query.toString()}`, {
		headers: {
			cookie: cookies,
		},
	});
	if (request.headers.get('content-type')?.includes('application/json')) {
		return (await request.json()) as NcorePageResponseJson;
	}
	// the API returns HTML if there are no results
	return {
		results: [],
		total_results: '0',
		onpage: 0,
		perpage: '0',
	} satisfies NcorePageResponseJson;
};

const rawGetTorrents = async (id: string) => {
	const [imdbId, season, episode] = id.split(':') as [string, string?, string?];
	const isMovie = !season && !episode;

	const baseParams: Record<string, string> = {
		mire: imdbId,
		miben: 'imdb',
		miszerint: 'seeders',
		tipus: 'kivalasztottak_kozott',
		jsons: 'true',
		kivalasztott_tipus: isMovie ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
	};

	// fetching the first page to get the last page number
	const firstPageQuery = new URLSearchParams({ ...baseParams, oldal: `1` });
	const firstPage = await fetchTorrents(firstPageQuery);
	const lastPage = Math.ceil(Number(firstPage.total_results) / Number(firstPage.perpage));

	// fetching the rest of the pages
	const restPagePromises: Promise<NcorePageResponseJson>[] = [];
	for (let page = 2; page <= lastPage; page++) {
		const query = new URLSearchParams({ ...baseParams, oldal: `${page}` });
		restPagePromises.push(fetchTorrents(query));
	}
	const pages = [firstPage, ...(await Promise.all(restPagePromises))];
	const allNcoreTorrents = pages.flatMap((page) => page.results);

	const allTorrentsWithParsedData = await processInBatches(
		allNcoreTorrents,
		BATCH_SIZE,
		BATCH_DELAY,
		async (torrent) => {
			const torrentData = await downloadAndParseTorrent(torrent.download_url);
			const { infoHash, files = [] } = torrentData;
			const [selectedFileIdx, { resolution, languages = [] }] = findTorrentFileIdx(
				{ ...torrent, files, infoHash },
				isMovie ? undefined : { season: Number(season), episode: Number(episode) },
			);
			return {
				...torrent,
				files,
				infoHash,
				resolution,
				languages,
				selectedFileIdx,
			};
		},
	);

	return allTorrentsWithParsedData.filter(({ selectedFileIdx, files }) => {
		return (
			selectedFileIdx !== null &&
			!!files[selectedFileIdx] &&
			isSupportedMedia(files[selectedFileIdx]!.path)
		);
	}) satisfies FullTorrent[];
};

export const getTorrents = memoize({ fn: rawGetTorrents, cacheTime: 1000 * 60, maxCacheSize: 100 });

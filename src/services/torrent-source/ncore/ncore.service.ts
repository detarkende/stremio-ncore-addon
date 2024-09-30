import cookieParser from 'set-cookie-parser';
import { JSDOM } from 'jsdom';
import type { TorrentSource } from '../types';
import type { NcorePageResponseJson } from './types';
import {
	BATCH_DELAY,
	BATCH_SIZE,
	MOVIE_CATEGORY_FILTERS,
	SERIES_CATEGORY_FILTERS,
} from './constants';
import { NcoreTorrentDetails } from './ncore-torrent-details';
import { config } from '@/config';
import type { TorrentService } from '@/services/torrent';
import type { StreamQuery } from '@/schemas/stream.schema';
import { StreamType } from '@/schemas/stream.schema';
import { processInBatches } from '@/utils/process-in-batches';

export class NcoreService implements TorrentSource {
	public torrentSourceName = 'ncore';

	constructor(private torrentService: TorrentService) {}
	private cookiesCache = {
		pass: null as string | null,
		cookieExpirationDate: 0,
	};

	private async getCookies(username: string, password: string): Promise<string> {
		if (this.cookiesCache.pass && this.cookiesCache.cookieExpirationDate > Date.now() + 1000) {
			return this.cookiesCache.pass;
		}
		const form = new FormData();
		form.append('set_lang', 'hu');
		form.append('submitted', '1');
		form.append('nev', username);
		form.append('pass', password);
		form.append('ne_leptessen_ki', '1');
		const resp = await fetch(`${config.NCORE_URL}/login.php`, {
			method: 'POST',
			body: form,
			redirect: 'manual',
		});
		const allCookies = cookieParser.parse(resp.headers.getSetCookie());
		const passCookie = allCookies.find(({ name }) => name === 'pass');

		if (!passCookie || passCookie.value === 'deleted') {
			throw new Error('Failed to log in to nCore. No pass cookie found');
		}
		const fullCookieString = allCookies.map(({ name, value }) => `${name}=${value}`).join('; ');
		this.cookiesCache.pass = fullCookieString;
		if (passCookie.expires) {
			this.cookiesCache.cookieExpirationDate = passCookie.expires.getTime();
		}

		return fullCookieString;
	}

	private async fetchTorrents(query: URLSearchParams): Promise<NcorePageResponseJson> {
		const cookies = await this.getCookies(config.NCORE_USERNAME, config.NCORE_PASSWORD);
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
	}

	public async getTorrentsForImdbId({
		imdbId,
		type,
	}: Pick<StreamQuery, 'imdbId' | 'type'>): Promise<NcoreTorrentDetails[]> {
		const baseParams: Record<string, string> = {
			mire: imdbId,
			miben: 'imdb',
			miszerint: 'seeders',
			tipus: 'kivalasztottak_kozott',
			jsons: 'true',
			kivalasztott_tipus:
				type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
		};

		// fetching the first page to get the last page number
		const firstPageQuery = new URLSearchParams({ ...baseParams, oldal: `1` });
		const firstPage = await this.fetchTorrents(firstPageQuery);
		const lastPage = Math.ceil(Number(firstPage.total_results) / Number(firstPage.perpage));

		// fetching the rest of the pages
		const restPagePromises: Promise<NcorePageResponseJson>[] = [];
		for (let page = 2; page <= lastPage; page++) {
			const query = new URLSearchParams({ ...baseParams, oldal: `${page}` });
			restPagePromises.push(this.fetchTorrents(query));
		}
		const pages = [firstPage, ...(await Promise.all(restPagePromises))];
		const allNcoreTorrents = pages.flatMap((page) => page.results);

		const torrentsWithParsedData = await processInBatches(
			allNcoreTorrents,
			BATCH_SIZE,
			BATCH_DELAY,
			async (torrent) => {
				const parsedData = await this.torrentService.downloadAndParseTorrent(
					torrent.download_url,
				);
				return new NcoreTorrentDetails(torrent, parsedData);
			},
		);
		return torrentsWithParsedData;
	}

	public async getTorrentUrlBySourceId(ncoreId: string) {
		const cookies = await this.getCookies(config.NCORE_USERNAME, config.NCORE_PASSWORD);
		const response = await fetch(
			`${config.NCORE_URL}/torrents.php?action=details&id=${ncoreId}`,
			{
				headers: {
					cookie: cookies,
				},
			},
		);
		''.match(/(?<statuscode>\d{3}) (?<name>.*)/)?.groups;

		const html = await response.text();
		const { document } = new JSDOM(html).window;
		const downloadLink = `${config.NCORE_URL}/${document
			.querySelector('.download > a')
			?.getAttribute('href')}`;
		return downloadLink;
	}

	public async getRemovableInfoHashes(): Promise<string[]> {
		const cookie = await this.getCookies(config.NCORE_USERNAME, config.NCORE_PASSWORD);
		const request = await fetch(`${config.NCORE_URL}/hitnrun.php?showall=true`, {
			headers: { cookie },
		});
		const html = await request.text();
		const { document } = new JSDOM(html).window;

		const rows = Array.from(document.querySelectorAll('.hnr_all, .hnr_all2'));
		const deletableRows = rows.filter(
			(row) => row.querySelector('.hnr_ttimespent')?.textContent === '-',
		);

		const deletableInfoHashPromises: Promise<string>[] = deletableRows.map(async (row) => {
			const detailsUrl = row.querySelector('.hnr_tname a')?.getAttribute('href') ?? '';
			const searchParams = new URLSearchParams(detailsUrl.split('?')[1] ?? '');
			const ncoreId = searchParams.get('id') ?? '';
			const downloadUrl = await this.getTorrentUrlBySourceId(ncoreId);
			const { infoHash } = await this.torrentService.downloadAndParseTorrent(downloadUrl);
			return infoHash;
		});

		const deletableInfoHashes = (await Promise.allSettled(deletableInfoHashPromises))
			.filter(
				(result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled',
			)
			.map((result) => result.value);
		return deletableInfoHashes;
	}
}

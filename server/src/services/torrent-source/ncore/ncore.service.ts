import cookieParser from 'set-cookie-parser';
import { JSDOM } from 'jsdom';
import type { ParsedTorrentDetails, TorrentSource } from '../types';
import {
  NcoreOrderBy,
  NcoreSearchBy,
  type NcorePageResponseJson,
  type NcoreQueryParams,
} from './types';
import {
  BATCH_DELAY,
  BATCH_SIZE,
  MOVIE_CATEGORY_FILTERS,
  SERIES_CATEGORY_FILTERS,
} from './constants';
import { NcoreTorrentDetails } from './ncore-torrent-details';
import type { TorrentService } from '@/services/torrent';
import type { StreamQuery } from '@/schemas/stream.schema';
import { StreamType } from '@/schemas/stream.schema';
import { processInBatches } from '@/utils/process-in-batches';
import { CinemeatService } from '@/services/cinemeta';
import { isSupportedMedia } from '@/utils/media-file-extensions';
import { Cached, DEFAULT_MAX, DEFAULT_TTL } from '@/utils/cache';
import { throwServerError } from '@/utils/errors';

export class NcoreService implements TorrentSource {
  public name = 'ncore';
  public displayName = 'nCore';

  constructor(
    private torrentService: TorrentService,
    private cinemetaService: CinemeatService,
    private ncoreUrl: string,
    private ncoreUsername: string,
    private ncorePassword: string,
  ) {}
  private cookiesCache = {
    pass: null as string | null,
    cookieExpirationDate: 0,
  };

  public async getCookies(username: string, password: string): Promise<string> {
    try {
      if (
        this.cookiesCache.pass &&
        this.cookiesCache.cookieExpirationDate > Date.now() + 1000
      ) {
        return this.cookiesCache.pass;
      }
      const form = new FormData();
      form.append('set_lang', 'hu');
      form.append('submitted', '1');
      form.append('nev', username);
      form.append('pass', password);
      form.append('ne_leptessen_ki', '1');
      const resp = await fetch(`${this.ncoreUrl}/login.php`, {
        method: 'POST',
        body: form,
        redirect: 'manual',
      });
      const allCookies = cookieParser.parse(resp.headers.getSetCookie());
      const passCookie = allCookies.find(({ name }) => name === 'pass');

      if (!passCookie || passCookie.value === 'deleted') {
        throw new Error('Failed to log in to nCore. No pass cookie found');
      }
      const fullCookieString = allCookies
        .map(({ name, value }) => `${name}=${value}`)
        .join('; ');
      this.cookiesCache.pass = fullCookieString;
      if (passCookie.expires) {
        this.cookiesCache.cookieExpirationDate = passCookie.expires.getTime();
      }

      return fullCookieString;
    } catch (error) {
      throw throwServerError(error, 'Failed to get cookies from nCore');
    }
  }

  public async getConfigIssues(): Promise<string | null> {
    try {
      await this.getCookies(this.ncoreUsername, this.ncorePassword);
      return null;
    } catch {
      console.error('Failed to log in to nCore while checking nCore config');
      return 'Failed to log in to nCore. Check your credentials in the environment variables.';
    }
  }

  private async fetchTorrents(query: URLSearchParams): Promise<NcorePageResponseJson> {
    const cookies = await this.getCookies(this.ncoreUsername, this.ncorePassword);
    try {
      const request = await fetch(`${this.ncoreUrl}/torrents.php?${query.toString()}`, {
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
    } catch (error) {
      throw throwServerError(error, 'Failed to fetch torrents from nCore');
    }
  }

  @Cached({
    max: DEFAULT_MAX,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    generateKey: (queryParams) => new URLSearchParams(queryParams).toString(),
  })
  private async getTorrentsForQuery(
    queryParams: NcoreQueryParams,
  ): Promise<NcoreTorrentDetails[]> {
    const baseParams = {
      ...queryParams,
      tipus: 'kivalasztottak_kozott',
      jsons: 'true',
    };

    // fetching the first page to get the last page number
    const firstPageQuery = new URLSearchParams({ ...baseParams, oldal: `1` });
    const firstPage = await this.fetchTorrents(firstPageQuery);
    const lastPage = Math.ceil(
      Number(firstPage.total_results) / Number(firstPage.perpage),
    );

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

  private filterTorrentsBySeasonAndEpisode(
    torrents: NcoreTorrentDetails[],
    { season, episode }: { season?: number; episode?: number },
  ) {
    return torrents.filter((torrent) => {
      const file = torrent.files[torrent.getMediaFileIndex({ season, episode })];
      return file !== undefined && isSupportedMedia(file.path);
    });
  }

  public async getTorrentsForImdbId({
    imdbId,
    type,
    season,
    episode,
  }: Pick<StreamQuery, 'imdbId' | 'type' | 'season' | 'episode'>): Promise<
    NcoreTorrentDetails[]
  > {
    let torrents = await this.getTorrentsForQuery({
      mire: imdbId,
      miben: NcoreSearchBy.IMDB,
      miszerint: NcoreOrderBy.SEEDERS,
      kivalasztott_tipus:
        type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
    });
    torrents = this.filterTorrentsBySeasonAndEpisode(torrents, { season, episode });

    if (torrents.length > 0) {
      return torrents;
    }
    let name = '';
    try {
      const cinemetaData = await this.cinemetaService.getMetadataByImdbId(type, imdbId);
      name = cinemetaData.meta.name;
    } catch (error) {
      console.error('Failed to get metadata from Cinemeta', error);
      return [];
    }
    torrents = await this.getTorrentsForQuery({
      mire: name,
      miben: NcoreSearchBy.NAME,
      miszerint: NcoreOrderBy.SEEDERS,
      kivalasztott_tipus:
        type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
    });
    torrents.forEach((torrent) => {
      torrent.isSpeculated = true;
    });
    torrents = this.filterTorrentsBySeasonAndEpisode(torrents, { season, episode });

    return torrents;
  }

  public async getTorrentUrlBySourceId(ncoreId: string) {
    const cookies = await this.getCookies(this.ncoreUsername, this.ncorePassword);
    try {
      const response = await fetch(
        `${this.ncoreUrl}/torrents.php?action=details&id=${ncoreId}`,
        {
          headers: {
            cookie: cookies,
          },
        },
      );

      const html = await response.text();
      const { document } = new JSDOM(html).window;
      const downloadLink = `${this.ncoreUrl}/${document
        .querySelector('.download > a')
        ?.getAttribute('href')}`;
      return downloadLink;
    } catch (error) {
      throw throwServerError(error, 'Failed to get torrent URL from nCore');
    }
  }

  public async getRemovableInfoHashes(): Promise<string[]> {
    const cookie = await this.getCookies(this.ncoreUsername, this.ncorePassword);
    try {
      const request = await fetch(`${this.ncoreUrl}/hitnrun.php?showall=true`, {
        headers: { cookie },
      });
      const html = await request.text();
      const { document } = new JSDOM(html).window;

      const rows = Array.from(document.querySelectorAll('.hnr_all, .hnr_all2'));
      const deletableRows = rows.filter(
        (row) => row.querySelector('.hnr_ttimespent')?.textContent === '-',
      );

      const deletableNcoreIds = deletableRows.map((row) => {
        const detailsUrl = row.querySelector('.hnr_tname a')?.getAttribute('href') ?? '';
        const searchParams = new URLSearchParams(detailsUrl.split('?')[1] ?? '');
        const ncoreId = searchParams.get('id') ?? '';
        return ncoreId;
      });

      const deletableTorrentPromises = deletableNcoreIds.map(async (ncoreId) => {
        const downloadUrl = await this.getTorrentUrlBySourceId(ncoreId);
        const torrent = await this.torrentService.downloadAndParseTorrent(downloadUrl);
        return torrent;
      });

      const deletableTorrents = (await Promise.allSettled(deletableTorrentPromises))
        .filter(
          (result): result is PromiseFulfilledResult<ParsedTorrentDetails> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);

      deletableTorrents.map((torrent) => {
        console.log(`Torrent "${torrent.infoHash}" can be deleted.`);
      });
      return deletableTorrents.map(({ infoHash }) => infoHash);
    } catch (error) {
      console.error('Failed to get removable torrents from nCore', error);
      throw new Error('Failed to get removable torrents from nCore', { cause: error });
    }
  }
}

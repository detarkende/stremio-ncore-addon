import { JSDOM } from 'jsdom';
import cookieParser from 'set-cookie-parser';
import { StreamType } from 'src/app/stream/stream.constants';
import { env } from 'src/env';
import { logger } from 'src/logger';
import { cacheFunction, DEFAULT_MAX, DEFAULT_TTL } from 'src/utils/cache';
import { getAllPromiseResults } from 'src/utils/get-all-promise-results';
import { batchAsyncFunctions } from 'src/utils/process-in-batches';

import { downloadAndParseTorrent } from '../torrent/torrent-file.utils';
import { NcoreTorrentDetails } from './ncore-torrent-details';
import {
  BATCH_DELAY,
  BATCH_SIZE,
  MOVIE_CATEGORY_FILTERS,
  SERIES_CATEGORY_FILTERS,
} from './ncore.constants';
import {
  NcoreOrderBy,
  NcoreSearchBy,
  type NcoreQueryParams,
  type NcoreTorrent,
} from './ncore.types';
import { getAllPages, getNcoreSearchResults } from './ncore.utils';

export class NcoreService {
  _cookiesCache = {
    pass: null as string | null,
    cookieExpirationDate: 0,
  };
  async _getCookies() {
    {
      try {
        const username = env.NCORE_USERNAME;
        const password = env.NCORE_PASSWORD;
        const ncoreUrl = env.NCORE_URL;
        if (
          this._cookiesCache.pass &&
          this._cookiesCache.cookieExpirationDate > Date.now() + 1000
        ) {
          return this._cookiesCache.pass;
        }
        logger.info(`Fetching cookies for nCore user "${username}"`);
        const body = new FormData();
        body.append('set_lang', 'hu');
        body.append('submitted', '1');
        body.append('nev', username);
        body.append('pass', password);
        body.append('ne_leptessen_ki', '1');
        const resp = await fetch(`${ncoreUrl}/login.php`, {
          method: 'POST',
          body,
          redirect: 'manual',
        });

        const setCookieHeader = resp.headers.get('set-cookie');
        if (!setCookieHeader) {
          logger.error(
            {
              status: resp.status,
              headers: resp.headers,
            },
            `No Set-Cookie header received when logging in to nCore for user "${username}"`,
          );
          throw new Error('No Set-Cookie header received', {
            cause: { status: resp.status, headers: resp.headers, username },
          });
        }
        const allCookies = cookieParser.parse(
          cookieParser.splitCookiesString(setCookieHeader),
        );
        const passCookie = allCookies.find(({ name }) => name === 'pass');

        if (!passCookie || passCookie.value === 'deleted') {
          logger.error(
            {
              status: resp.status,
              headers: resp.headers,
            },
            `Failed to log in to nCore for user "${username}"`,
          );
          throw new Error('No pass cookie found', {
            cause: { passCookie, status: resp.status, headers: resp.headers, username },
          });
        }
        const fullCookieString = allCookies
          .map(({ name, value }) => `${name}=${value}`)
          .join('; ');
        this._cookiesCache.pass = fullCookieString;
        if (passCookie.expires) {
          this._cookiesCache.cookieExpirationDate = Number(passCookie.expires);
        }
        logger.info(`Successfully fetched cookies for nCore user "${username}"`);
        return fullCookieString;
      } catch (error) {
        logger.error({ error }, 'Failed to get cookies from nCore');
        throw new Error('Failed to get cookies from nCore', { cause: error });
      }
    }
  }

  async _getTorrentsForQuery(queryParams: NcoreQueryParams): Promise<NcoreTorrent[]> {
    const baseParams = {
      ...queryParams,
      tipus: 'kivalasztottak_kozott',
      jsons: 'true',
    };

    const cookies = await this._getCookies();

    const results: NcoreTorrent[] = await getAllPages(async (page) => {
      const query = new URLSearchParams({
        ...baseParams,
        oldal: page.toString(),
      });
      const request = await fetch(`${env.NCORE_URL}/torrents.php?${query.toString()}`, {
        headers: {
          cookie: cookies,
        },
      });
      const body = (await request.text()) ?? '';
      const pageResponse = getNcoreSearchResults(body);
      return pageResponse;
    });
    return results;
  }

  async _convertNcoreTorrentToTorrentDetails(ncoreTorrents: NcoreTorrent[]) {
    const torrentDetailPromiseFns = ncoreTorrents.map((ncoreTorrent) => async () => {
      const { torrentFileData } = await downloadAndParseTorrent(
        ncoreTorrent.download_url,
      );
      return new NcoreTorrentDetails(ncoreTorrent, torrentFileData);
    });
    const batchedPromises = batchAsyncFunctions({
      batchSize: BATCH_SIZE,
      delayMs: BATCH_DELAY,
      functions: torrentDetailPromiseFns,
    });

    const [ncoreTorrentDetails, errors] = await getAllPromiseResults(batchedPromises);
    if (errors.length > 0) {
      logger.warn(
        {
          errors,
        },
        'Encountered errors while fetching torrent details',
      );
    }
    return ncoreTorrentDetails;
  }

  public getTorrentsByImdbId = cacheFunction(
    {
      max: DEFAULT_MAX,
      ttl: DEFAULT_TTL,
      ttlAutopurge: true,
      generateKey: (params) => `${params.type}:${params.imdbId}`,
    },
    async ({
      imdbId,
      type,
    }: {
      imdbId: string;
      type: StreamType;
    }): Promise<NcoreTorrentDetails[]> => {
      const ncoreTorrents = await this._getTorrentsForQuery({
        mire: imdbId,
        miben: NcoreSearchBy.IMDB,
        miszerint: NcoreOrderBy.SEEDERS,
        kivalasztott_tipus:
          type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
      });

      return this._convertNcoreTorrentToTorrentDetails(ncoreTorrents);
    },
  );

  public getTorrentsByTitle = cacheFunction(
    {
      max: DEFAULT_MAX,
      ttl: DEFAULT_TTL,
      ttlAutopurge: true,
      generateKey: (params) => `${params.type}:${params.title}`,
    },
    async ({
      title,
      type,
    }: {
      title: string;
      type: StreamType;
    }): Promise<NcoreTorrentDetails[]> => {
      const ncoreTorrents = await this._getTorrentsForQuery({
        mire: title,
        miben: NcoreSearchBy.NAME,
        miszerint: NcoreOrderBy.SEEDERS,
        kivalasztott_tipus:
          type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
      });
      return this._convertNcoreTorrentToTorrentDetails(ncoreTorrents);
    },
  );

  public async getTorrentUrlByNcoreId(ncoreId: string): Promise<string> {
    logger.info(`Getting torrent URL for nCore ID ${ncoreId}`);
    const cookies = await this._getCookies();
    try {
      const response = await fetch(
        `${env.NCORE_URL}/torrents.php?action=details&id=${ncoreId}`,
        {
          headers: {
            cookie: cookies,
          },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) {
        logger.error(
          {
            status: response.status,
            ncoreId,
          },
          `Failed to fetch torrent details page`,
        );
        throw new Error('Failed to fetch torrent details page', {
          cause: { status: response.status, ncoreId },
        });
      }
      const html = await response.text();
      logger.info({ ncoreId }, `Successfully fetched torrent details page`);
      const { document } = new JSDOM(html).window;
      const downloadLink = `${env.NCORE_URL}/${document
        .querySelector('.download > a')
        ?.getAttribute('href')}`;
      logger.info(
        {
          ncoreId,
          downloadLink,
        },
        `Successfully extracted torrent download URL`,
      );
      return downloadLink;
    } catch (error) {
      logger.error({ error, ncoreId }, `Failed to get torrent URL from nCore`);
      throw new Error('Failed to get torrent URL from nCore', { cause: error });
    }
  }

  public async getRemovableInfoHashes(): Promise<string[]> {
    logger.info(`Getting removable torrents from nCore`);
    const cookie = await this._getCookies();

    try {
      const request = await fetch(`${env.NCORE_URL}/hitnrun.php?showall=true`, {
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

      const [deletableInfoHashes, errors] = await getAllPromiseResults(
        deletableNcoreIds.map(async (ncoreId): Promise<string> => {
          const downloadUrl = await this.getTorrentUrlByNcoreId(ncoreId);
          const { torrentFileData } = await downloadAndParseTorrent(downloadUrl);
          return torrentFileData.infoHash;
        }),
      );
      if (errors.length > 0) {
        logger.warn(
          {
            errors,
          },
          'Encountered errors while fetching torrent URLs for deletable torrents',
        );
      }

      return deletableInfoHashes;
    } catch (error) {
      logger.error({ error }, 'Failed to get removable torrents from nCore');
      throw new Error('Failed to get removable torrents from nCore', { cause: error });
    }
  }

  public async isNcoreAccessible(): Promise<boolean> {
    try {
      const cookies = await this._getCookies();
      const response = await fetch(`${env.NCORE_URL}/torrents.php`, {
        headers: {
          cookie: cookies,
        },
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        logger.warn(
          {
            status: response.status,
          },
          `nCore is not accessible`,
        );
        return false;
      }
      logger.info(`nCore is accessible`);
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to access nCore');
      return false;
    }
  }
}

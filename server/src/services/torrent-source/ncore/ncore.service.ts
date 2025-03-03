import cookieParser from 'set-cookie-parser';
import { JSDOM } from 'jsdom';
import type { TorrentSource } from '../types';
import {
  Metadata,
  NcoreOrderBy,
  type NcorePageResponseJson,
  type NcoreQueryParams,
  NcoreSearchBy,
  TorrentMetadata,
} from './types';
import {
  BATCH_DELAY,
  BATCH_SIZE,
  MOVIE_CATEGORY_FILTERS,
  MovieCategory,
  SERIES_CATEGORY_FILTERS,
  SeriesCategory,
  TorrentCategory,
} from './constants';
import { NcoreTorrentDetails } from './ncore-torrent-details';
import type { TorrentService } from '@/services/torrent';
import type { StreamQuery } from '@/schemas/stream.schema';
import { StreamType } from '@/schemas/stream.schema';
import { processInBatches } from '@/utils/process-in-batches';
import { URLSearchParams } from 'url';
import { CinemeatService } from '@/services/cinemeta';
import { isSupportedMedia } from '@/utils/media-file-extensions';
import { Cached, DEFAULT_MAX, DEFAULT_TTL } from '@/utils/cache';
import { Language } from '@/db/schema/users';
import { env } from '@/env';
import { Genre } from '@/types/genre';

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
  }

  @Cached({
    max: DEFAULT_MAX,
    ttl: 12 * 60 * 60, // 12 hours
    ttlAutopurge: true,
    generateKey: (id: string) => id,
  })
  public async getMetadata(id: string): Promise<Metadata> {
    try {
      const cookies = await this.getCookies(this.ncoreUsername, this.ncorePassword);
      const response = await fetch(
        `${this.ncoreUrl}/torrents.php?action=details&id=${id}`,
        {
          headers: { cookie: cookies },
        },
      );
      const doc = new JSDOM(await response.text()).window.document;

      const getTextContent = (selector: string) =>
        doc.querySelector(selector)?.textContent?.trim() || '';
      const getNextTextContent = (text: string) =>
        Array.from(doc.querySelectorAll('.inforbar_txt td'))
          .find((el) => el.textContent?.trim() === text)
          ?.nextElementSibling?.textContent?.trim() || 'N/A';

      const posterUrl =
        (doc.querySelector('.inforbar_img img') as HTMLImageElement)?.src || '';

      const type = Array.from(doc.querySelectorAll('.torrent_col1 .dt'))
        .find((dt) => dt.textContent?.trim() === 'Típus:')
        ?.nextElementSibling?.querySelector('a')
        ?.textContent?.trim()
        ?.includes('Film')
        ? 'movie'
        : 'series';

      return {
        id: `ncore:${id}`,
        name: getTextContent('.infobar_title'),
        poster: posterUrl,
        background: posterUrl,
        director: getNextTextContent('Rendező:'),
        cast: getNextTextContent('Szereplők:'),
        runtime: getNextTextContent('Hossz:'),
        description: getTextContent('.torrent_leiras.proba42')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' '),
        year: getNextTextContent('Megjelenés éve:'),
        type: type,
        genre: [],
        imdbRating: '0',
        posterShape: 'regular',
      };
    } catch (error) {
      console.error('Error fetching or extracting data:', error);
      throw new Error('Could not fetch from nCore');
    }
  }

  @Cached({
    max: DEFAULT_MAX,
    ttl: 12 * 60 * 60, // 12 hours
    ttlAutopurge: true,
    generateKey: (id: string) => id,
  })
  public async getTorrentMetadata(id: string): Promise<TorrentMetadata> {
    try {
      const cookies = await this.getCookies(this.ncoreUsername, this.ncorePassword);
      const response = await fetch(
        `${this.ncoreUrl}/torrents.php?action=details&id=${id}`,
        {
          headers: { cookie: cookies },
        },
      );
      const doc = new JSDOM(await response.text()).window.document;

      const getTextContent = (selector: string) =>
        doc.querySelector(selector)?.textContent?.trim() || '';

      const torrentLink =
        (doc.querySelector('.download a') as HTMLAnchorElement)?.href || '';

      const size = parseInt(
        getTextContent('.torrent_col2 .dt:contains("Méret:")')?.match(
          /\((\d+) bájt\)/,
        )?.[1] || '0',
        10,
      );
      const torrentCategory = (doc
        .querySelector('.torrent_col1 .dd a[href*="tipus="]')
        ?.getAttribute('href')
        ?.match(/tipus=([^&]+)/)?.[1] || '') as TorrentCategory;

      return {
        torrentUrl: `${this.ncoreUrl}/${torrentLink}`,
        torrentCategory: torrentCategory,
        detailsUrl: `${this.ncoreUrl}/torrents.php?action=details&id=${id}`,
        seeders: Number(getTextContent('.torrent_col2 .dt:contains("Seederek:")')),
        size: size,
        leechers: Number(getTextContent('.torrent_col2 .dt:contains("Leecherek:")')),
      };
    } catch (error) {
      console.error('Error fetching or extracting data:', error);
      throw new Error('Could not fetch from nCore');
    }
  }

  @Cached({
    max: DEFAULT_MAX,
    ttl: 12 * 60 * 60, // 12 hours
    ttlAutopurge: true,
    generateKey: (
      type: string,
      preferredLanguage: Language,
      skip: number | undefined,
      genre: string | undefined,
      search: string | undefined,
    ) => `${type}-${preferredLanguage}-${skip ?? ''}-${genre ?? ''}-${search ?? ''}`,
  })
  public async getPageableTrendingTorrents(
    type: string,
    preferredLanguage: Language,
    skip: number | undefined,
    genre: string | undefined,
    search: string | undefined,
  ): Promise<Metadata[]> {
    if (genre && preferredLanguage === Language.EN) {
      genre = Genre.convertToHungarian(genre);
    }

    const queryParams = new URLSearchParams({
      miszerint: 'seeders',
      hogyan: 'DESC',
      tipus: 'kivalasztottak_kozott',
      jsons: 'true',
      kivalasztott_tipus:
        type === 'series'
          ? `${SeriesCategory.HD_HUN},${SeriesCategory.HD}`
          : `${MovieCategory.HD_HUN},${MovieCategory.HD}`,
      miben: 'name',
      mire: search || '',
      tags: genre || '',
    });

    const page = skip ? Math.floor(skip / 25) * 3 + 1 : 1;
    queryParams.set('oldal', `${page}`);
    const firstPage = await this.fetchTorrents(queryParams);
    queryParams.set('oldal', `${page + 1}`);
    const secondPage = await this.fetchTorrents(queryParams);
    queryParams.set('oldal', `${page + 2}`);
    const thirdPage = await this.fetchTorrents(queryParams);
    const pages = [firstPage, secondPage, thirdPage];

    const allNcoreTorrents = pages.flatMap((page) => page.results);

    const tmdbApiKey = env.TMDB_API_KEY;
    const userLanguage = preferredLanguage === Language.HU ? 'hu-HU' : 'en-US';

    const tmdbPromises = allNcoreTorrents.map(async (torrent) => {
      if (!torrent.imdb_id) {
        return this.getMetadata(torrent.torrent_id);
      } else {
        const response = await fetch(
          `https://api.themoviedb.org/3/find/${torrent.imdb_id}?api_key=${tmdbApiKey}&language=${userLanguage}&external_source=imdb_id`,
        );
        const data = await response.json();
        const content =
          (data.movie_results && data.movie_results[0]) ||
          (data.tv_results && data.tv_results[0]) ||
          {};
        return content
          ? ({
              id: torrent.imdb_id,
              name: content.title || content.name,
              genre: content.genres
                ? content.genres.map((genre: { name: string }) => genre.name)
                : [],
              poster: `https://image.tmdb.org/t/p/w500${content.poster_path}`,
              background: `https://image.tmdb.org/t/p/original${content.backdrop_path}`,
              posterShape: 'regular',
              imdbRating: content.vote_average,
              year: (content.release_date || content.first_air_date || '').split('-')[0],
              type: content.media_type === 'movie' ? 'movie' : 'series',
              description: content.overview,
              cast: '',
              director: '',
            } as Metadata)
          : null;
      }
    });

    return (await Promise.all(tmdbPromises)).filter((result) => result !== null);
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
    if (imdbId.startsWith('ncore:')) {
      return this.getTorrentsForNcoreId(imdbId.replace('ncore:', ''));
    }

    let torrents = await this.getTorrentsForQuery({
      mire: imdbId,
      miben: NcoreSearchBy.IMDB,
      miszerint: NcoreOrderBy.SEEDERS,
      kivalasztott_tipus:
        type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
    });
    torrents = this.filterTorrentsBySeasonAndEpisode(torrents, { season, episode });
    if (torrents.length > 0) return torrents;

    try {
      const {
        meta: { name },
      } = await this.cinemetaService.getMetadataByImdbId(type, imdbId);
      torrents = await this.getTorrentsForQuery({
        mire: name,
        miben: NcoreSearchBy.NAME,
        miszerint: NcoreOrderBy.SEEDERS,
        kivalasztott_tipus:
          type === StreamType.MOVIE ? MOVIE_CATEGORY_FILTERS : SERIES_CATEGORY_FILTERS,
      });
      torrents.forEach((torrent) => (torrent.isSpeculated = true));
      torrents = this.filterTorrentsBySeasonAndEpisode(torrents, { season, episode });
      return torrents;
    } catch (error) {
      console.error('Failed to get metadata from Cinemeta', error);
      return [];
    }
  }

  private async getTorrentsForNcoreId(ncoreId: string): Promise<NcoreTorrentDetails[]> {
    const metadata = await this.getMetadata(ncoreId);
    const torrentMetadata = await this.getTorrentMetadata(ncoreId);
    if (!torrentMetadata.torrentUrl) throw new Error('Torrent URL is undefined');

    const parsedData = await this.torrentService.downloadAndParseTorrent(
      torrentMetadata.torrentUrl,
    );
    return [
      new NcoreTorrentDetails(
        {
          torrent_id: ncoreId,
          category: torrentMetadata.torrentCategory,
          release_name: metadata.name,
          details_url: torrentMetadata.detailsUrl,
          download_url: torrentMetadata.torrentUrl,
          freeleech: true,
          imdb_id: '',
          imdb_rating: 0,
          size: `${torrentMetadata.size}`,
          type: metadata.type === 'movie' ? 'movie' : 'show',
          leechers: `${torrentMetadata.leechers}`,
          seeders: torrentMetadata.seeders,
        },
        parsedData,
      ),
    ];
  }

  public async getTorrentUrlBySourceId(ncoreId: string) {
    const cookies = await this.getCookies(this.ncoreUsername, this.ncorePassword);
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
  }

  public async getRemovableInfoHashes(): Promise<string[]> {
    const cookie = await this.getCookies(this.ncoreUsername, this.ncorePassword);
    const request = await fetch(`${this.ncoreUrl}/hitnrun.php?showall=true`, {
      headers: { cookie },
    });
    const html = await request.text();
    const { document } = new JSDOM(html).window;

    const rows = Array.from(document.querySelectorAll('.hnr_all, .hnr_all2'));
    const deletableRows = rows.filter(
      (row) => row.querySelector('.hnr_ttimespent')?.textContent === '-',
    );

    const deletableInfoHashPromises: Promise<string>[] = deletableRows.map(
      async (row) => {
        const detailsUrl = row.querySelector('.hnr_tname a')?.getAttribute('href') ?? '';
        const searchParams = new URLSearchParams(detailsUrl.split('?')[1] ?? '');
        const ncoreId = searchParams.get('id') ?? '';
        const downloadUrl = await this.getTorrentUrlBySourceId(ncoreId);
        const { infoHash } =
          await this.torrentService.downloadAndParseTorrent(downloadUrl);
        return infoHash;
      },
    );

    const deletableInfoHashes = (await Promise.allSettled(deletableInfoHashPromises))
      .filter(
        (result): result is PromiseFulfilledResult<string> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);
    return deletableInfoHashes;
  }
}

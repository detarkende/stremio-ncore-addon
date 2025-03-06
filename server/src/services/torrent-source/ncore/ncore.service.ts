import cookieParser from 'set-cookie-parser';
import { JSDOM } from 'jsdom';
import type { TorrentSource } from '../types';
import {
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
import { Genre } from '@/types/genre';
import { TmdbService } from '@/services/catalog/tmdb.service';
import { DetailedMetadata, SimpleMetadata } from '@/services/metadata';

export class NcoreService implements TorrentSource {
  public name = 'ncore';
  public displayName = 'nCore';

  constructor(
    private torrentService: TorrentService,
    private cinemetaService: CinemeatService,
    private ncoreUrl: string,
    private ncoreUsername: string,
    private ncorePassword: string,
    private tmdbService: TmdbService,
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
  public async getMetadata(id: string): Promise<DetailedMetadata> {
    try {
      const cookies = await this.getCookies(this.ncoreUsername, this.ncorePassword);
      const response = await fetch(
        `${this.ncoreUrl}/torrents.php?action=details&id=${id}`,
        {
          headers: { cookie: cookies },
        },
      );
      const dom = new JSDOM(await response.text());
      const doc = dom.window.document;

      const getTextContent = (xpath: string) =>
        this.extractByXPath(dom, doc, xpath) || '';
      const getNextTextContent = (text: string) =>
        this.extractByXPath(
          dom,
          doc,
          `//td[text()="${text}"]/following-sibling::td/text()`,
        ) || 'N/A';
      const posterUrl =
        this.extractByXPath(dom, doc, `//td[@class="inforbar_img"]//img/@src`) || '';
      const type = this.extractByXPath(
        dom,
        doc,
        `//div[@class="torrent_col1"]//div[@class="dt"][text()="Típus:"]/following-sibling::div[@class="dd"]/a[1]/text()`,
      )?.includes('Film')
        ? 'movie'
        : 'series';

      return {
        id: `ncore:${id}`, // Assuming id is defined earlier
        name: getTextContent(`//div[@class="infobar_title"]/text()`),
        poster: posterUrl,
        background: posterUrl,
        director: [getNextTextContent('Rendező:')],
        cast: [getNextTextContent('Szereplők:')],
        runtime: getNextTextContent('Hossz:'),
        description: this.extractMultipleByXPath(
          dom,
          doc,
          '//div[@class="torrent_leiras proba42"]//text()',
        )
          .join(' ')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' '),
        year: getNextTextContent('Megjelenés éve:'),
        type: type,
        genre: [],
        imdbRating: '0',
      } as DetailedMetadata;
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
      const dom = new JSDOM(await response.text());
      const doc = dom.window.document;
      const extractText = (xpath: string) => this.extractByXPath(dom, doc, xpath);

      const sizeMatch = extractText(
        `//div[@class="torrent_col2"]/div[@class="dt"][text()="Méret:"]/following-sibling::div[@class="dd"]/text()`,
      )?.match(/\((\d+)\s*bájt\)/);
      const size = sizeMatch ? Number(sizeMatch[1]) : 0;

      return {
        torrentUrl: `${this.ncoreUrl}/${extractText(`//div[@class="download"]/a/@href`)}`,
        torrentCategory: (extractText(
          `//div[@class="torrent_col1"]//div[@class="dd"]//a[contains(@href, "tipus=")]/@href`,
        )?.match(/tipus=([^&]+)/)?.[1] || '') as TorrentCategory,
        detailsUrl: `${this.ncoreUrl}/torrents.php?action=details&id=${id}`,
        seeders: Number(
          extractText(
            `//div[@class="torrent_col2"]/div[@class="dt"][text()="Seederek:"]/following-sibling::div[@class="dd"]/a/text()`,
          ),
        ),
        size: size,
        leechers: Number(
          extractText(
            `//div[@class="torrent_col2"]/div[@class="dt"][text()="Leecherek:"]/following-sibling::div[@class="dd"]/a/text()`,
          ),
        ),
      };
    } catch (error) {
      console.error('Error fetching or extracting data:', error);
      throw new Error('Could not fetch from nCore');
    }
  }

  private extractMultipleByXPath(dom: JSDOM, doc: Document, xpath: string): string[] {
    const result = doc.evaluate(
      xpath,
      doc,
      null,
      dom.window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    const nodes = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i)?.textContent?.trim() || '');
    }
    return nodes;
  }

  private extractByXPath(dom: JSDOM, doc: Document, xpath: string): string | null {
    const result = doc.evaluate(
      xpath,
      doc,
      null,
      dom.window.XPathResult.STRING_TYPE,
      null,
    );
    return result.stringValue.trim() || null;
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
  ): Promise<SimpleMetadata[]> {
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

    const tmdbPromises = allNcoreTorrents.map(async (torrent) => {
      if (!torrent.imdb_id) {
        return this.getMetadata(torrent.torrent_id);
      } else {
        return await this.tmdbService.findSimpleMetadataByImdbId(
          torrent.imdb_id,
          preferredLanguage,
        );
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

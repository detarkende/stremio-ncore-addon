import { env } from '@server/env';
import { logger } from '@server/logger';
import { fetchMock } from '@server/test-utils/fetch-mock';
import { createTestNcoreTorrentResultArray } from '@server/test-utils/ncore';
import { getRandomString } from '@server/test-utils/random';
import { FormData } from 'undici';
import type { MockInstance } from 'vitest';

import * as torrentFileUtils from '../../torrent/torrent-file.utils';
import { MOVIE_CATEGORY_FILTERS } from '../ncore.constants';
import { NcoreService } from '../ncore.service';
import type { NcorePageResponseJson } from '../ncore.types';
import { NcoreOrderBy, NcoreSearchBy } from '../ncore.types';
import * as ncoreUtils from '../ncore.utils';
import hitNRunMockHtml from './mocks/hitnrun.html?raw';
import torrentDetailMockHtml from './mocks/torrent-details.html?raw';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('nCore service', () => {
  let ncoreService: NcoreService;
  let downloadAndParseTorrentSpy: MockInstance<
    typeof torrentFileUtils.downloadAndParseTorrent
  >;

  beforeEach(() => {
    downloadAndParseTorrentSpy = vi.spyOn(torrentFileUtils, 'downloadAndParseTorrent');
    ncoreService = new NcoreService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('_getCookies', () => {
    it('should return cookies on successful login', async () => {
      const username = 'test-user';
      const passCookieValue = getRandomString(32);
      env.NCORE_USERNAME = username;
      env.NCORE_PASSWORD = 'validPass';
      const expirationDate = Date.now() + 30 * ONE_DAY_MS;
      const expirationDateString = new Date(expirationDate).toUTCString();
      fetchMock.mockResolvedValueOnce(
        new Response('', {
          status: 302,
          headers: [
            ['Location', `index.php`],
            ['Cache-Control', 'no-cache, no-store, must-revalidate'],
            [
              'Set-Cookie',
              `nick=${username}; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            ],
            [
              'Set-Cookie',
              `pass=${passCookieValue}; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            ],
            [
              'Set-Cookie',
              `nyelv=hu; expires=${expirationDateString}; Max-Age=2592000; path=/`,
            ],
          ],
        }),
      );

      const cookies = await ncoreService['_getCookies']();

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/login.php'),
        expect.objectContaining({
          body: expect.any(FormData),
          method: 'POST',
        }),
      );
      expect(cookies).toBe(`nick=test-user; pass=${passCookieValue}; nyelv=hu`);
      expect(ncoreService['_cookiesCache'].pass).toBe(cookies);
      expect(ncoreService['_cookiesCache'].cookieExpirationDate).toBe(
        // Expiration date only has second precision
        Math.floor(expirationDate / 1000) * 1000,
      );
    });

    it('should use cached cookies if not expired', async () => {
      const cachedCookies = 'nick=cachedUser; pass=cachedPass; nyelv=hu';
      ncoreService['_cookiesCache'].pass = cachedCookies;
      ncoreService['_cookiesCache'].cookieExpirationDate = Date.now() + ONE_DAY_MS;

      const cookies = await ncoreService['_getCookies']();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(cookies).toBe(cachedCookies);
    });

    it('should fetch new cookies if cached cookies are expired', async () => {
      const cachedCookies = 'nick=cachedUser; pass=cachedPass; nyelv=hu';
      ncoreService['_cookiesCache'].pass = cachedCookies;
      ncoreService['_cookiesCache'].cookieExpirationDate = Date.now() - ONE_DAY_MS;

      const newPassCookieValue = getRandomString(32);
      const expirationDate = Date.now() + 30 * ONE_DAY_MS;
      const expirationDateString = new Date(expirationDate).toUTCString();
      fetchMock.mockResolvedValueOnce(
        new Response('', {
          status: 302,
          headers: [
            ['Location', 'index.php'],
            ['Cache-Control', 'no-cache, no-store, must-revalidate'],
            [
              'Set-Cookie',
              `nick=newUser; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            ],
            [
              'Set-Cookie',
              `pass=${newPassCookieValue}; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            ],
            [
              'Set-Cookie',
              `nyelv=hu; expires=${expirationDateString}; Max-Age=2592000; path=/`,
            ],
          ],
        }),
      );

      const cookies = await ncoreService['_getCookies']();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(cookies).toBe(`nick=newUser; pass=${newPassCookieValue}; nyelv=hu`);
      expect(ncoreService['_cookiesCache'].pass).toBe(cookies);
      expect(ncoreService['_cookiesCache'].cookieExpirationDate).toBe(
        // Expiration date only has second precision
        Math.floor(expirationDate / 1000) * 1000,
      );
    });

    it('should throw error when the credentials are incorrect', async () => {
      env.NCORE_USERNAME = 'test-user';
      env.NCORE_PASSWORD = 'invalidPass';
      fetchMock.mockResolvedValueOnce(
        new Response('Invalid credentials', {
          status: 302,
          headers: [
            ['Location', `login.php?problema=1&set_lang=hu`],
            ['Cache-Control', 'no-cache, no-store, must-revalidate'],
            [
              'Set-Cookie',
              `nick=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0; path=/`,
            ],
            [
              'Set-Cookie',
              `pass=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0; path=/`,
            ],
            ['Set-Cookie', `nyelv=hu; path=/`],
          ],
        }),
      );

      await expect(ncoreService['_getCookies']()).rejects.toThrow(
        'Failed to get cookies from nCore',
      );
    });
  });

  describe('_getTorrentsForQuery', () => {
    beforeEach(() => {
      vi.spyOn(ncoreService, '_getCookies').mockResolvedValueOnce(
        'nick=test-user; pass=valid_cookie_value; nyelv=hu',
      );
    });

    it('should fetch torrents for given query', async () => {
      const imdbId = 'tt1375666';
      const getAllPagesSpy = vi.spyOn(ncoreUtils, 'getAllPages');
      const mockTorrentsResults = createTestNcoreTorrentResultArray(8);
      fetchMock.mockResolvedValueOnce(
        Response.json({
          results: mockTorrentsResults,
          total_results: '8',
          onpage: 8,
          perpage: '8',
        } satisfies NcorePageResponseJson),
      );

      const torrents = await ncoreService['_getTorrentsForQuery']({
        kivalasztott_tipus: MOVIE_CATEGORY_FILTERS,
        miben: NcoreSearchBy.IMDB,
        miszerint: NcoreOrderBy.SEEDERS,
        mire: imdbId,
      });

      expect(getAllPagesSpy).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`/torrents.php?`), {
        headers: {
          cookie: expect.any(String),
        },
        dispatcher: expect.anything(),
      });
      expect(torrents).toEqual(mockTorrentsResults);
    });

    it('should not throw error when request fails', async () => {
      const imdbId = 'tt1375666';
      fetchMock.mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500 }),
      );

      const torrents = await ncoreService['_getTorrentsForQuery']({
        kivalasztott_tipus: MOVIE_CATEGORY_FILTERS,
        miben: NcoreSearchBy.IMDB,
        miszerint: NcoreOrderBy.SEEDERS,
        mire: imdbId,
      });
      expect(torrents).toEqual([]);
    });
  });

  describe('_convertNcoreTorrentToTorrentDetails', () => {
    it(`should download the torrent file for each torrent`, async () => {
      const mockNcoreTorrents = createTestNcoreTorrentResultArray(3);
      downloadAndParseTorrentSpy.mockResolvedValueOnce({
        torrentFileData: {
          name: mockNcoreTorrents[0].release_name,
          infoHash: mockNcoreTorrents[0].torrent_id,
          files: [],
        },
        torrentBuffer: Buffer.from([]),
      });
      downloadAndParseTorrentSpy.mockResolvedValueOnce({
        torrentFileData: {
          name: mockNcoreTorrents[1].release_name,
          infoHash: mockNcoreTorrents[1].torrent_id,
          files: [],
        },
        torrentBuffer: Buffer.from([]),
      });
      downloadAndParseTorrentSpy.mockResolvedValueOnce({
        torrentFileData: {
          name: mockNcoreTorrents[2].release_name,
          infoHash: mockNcoreTorrents[2].torrent_id,
          files: [],
        },
        torrentBuffer: Buffer.from([]),
      });

      const torrentDetailsArray =
        await ncoreService['_convertNcoreTorrentToTorrentDetails'](mockNcoreTorrents);
      expect(downloadAndParseTorrentSpy).toHaveBeenCalledTimes(3);
      expect(torrentDetailsArray.length).toBe(3);
      expect(torrentDetailsArray[0].infoHash).toBe(mockNcoreTorrents[0].torrent_id);
      expect(torrentDetailsArray[1].infoHash).toBe(mockNcoreTorrents[1].torrent_id);
      expect(torrentDetailsArray[2].infoHash).toBe(mockNcoreTorrents[2].torrent_id);
    });

    it('should fail silently but warn if one of the torrent downloads fails', async () => {
      const mockNcoreTorrents = createTestNcoreTorrentResultArray(3);
      downloadAndParseTorrentSpy.mockResolvedValueOnce({
        torrentFileData: {
          name: mockNcoreTorrents[0].release_name,
          infoHash: mockNcoreTorrents[0].torrent_id,
          files: [],
        },
        torrentBuffer: Buffer.from([]),
      });
      downloadAndParseTorrentSpy.mockRejectedValueOnce(
        new Error('Failed to download torrent'),
      );
      downloadAndParseTorrentSpy.mockResolvedValueOnce({
        torrentFileData: {
          name: mockNcoreTorrents[2].release_name,
          infoHash: mockNcoreTorrents[2].torrent_id,
          files: [],
        },
        torrentBuffer: Buffer.from([]),
      });

      const torrentDetailsArray =
        await ncoreService['_convertNcoreTorrentToTorrentDetails'](mockNcoreTorrents);
      expect(downloadAndParseTorrentSpy).toHaveBeenCalledTimes(3);
      expect(vi.mocked(logger).warning).toHaveBeenCalledOnce();
      expect(torrentDetailsArray.length).toBe(2);
      expect(torrentDetailsArray[0].infoHash).toBe(mockNcoreTorrents[0].torrent_id);
      expect(torrentDetailsArray[1].infoHash).toBe(mockNcoreTorrents[2].torrent_id);
    });
  });

  describe('getTorrentUrlByNcoreId', () => {
    it('should return the download URL for the given nCore torrent ID', async () => {
      vi.spyOn(ncoreService, '_getCookies').mockResolvedValue(
        'nick=test-user; pass=valid_cookie_value; nyelv=hu',
      );
      const ncoreId = '3037290';
      fetchMock.mockResolvedValueOnce(new Response(torrentDetailMockHtml));

      const downloadUrl = await ncoreService.getTorrentUrlByNcoreId(ncoreId);

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/torrents.php?action=details&id=${ncoreId}`),
        {
          headers: {
            cookie: expect.any(String),
          },
          signal: expect.anything(),
          dispatcher: expect.anything(),
        },
      );
      expect(downloadUrl).toBe(
        `https://ncore.pro/torrents.php?action=download&id=${ncoreId}&key=mockkey`,
      );
    });
  });

  describe('getSeedRequiredNcoreIds', () => {
    it('should return nCore IDs that are required to seed', async () => {
      vi.spyOn(ncoreService, '_getCookies').mockResolvedValue(
        'nick=test-user; pass=valid_cookie_value; nyelv=hu',
      );
      fetchMock.mockResolvedValueOnce(new Response(hitNRunMockHtml));

      const seedRequiredNcoreIds = await ncoreService.getSeedRequiredNcoreIds();

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/hitnrun.php?showall=false`),
        {
          headers: expect.objectContaining({
            cookie: expect.any(String),
          }),
        },
      );

      expect(seedRequiredNcoreIds).toEqual(['4054824']);
    });
  });
});

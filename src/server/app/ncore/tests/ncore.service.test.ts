import type { ParsedTorrentDetails } from '@server/app/torrent';
import { env } from '@server/env';
import { logger } from '@server/logger';
import { createTestNcoreTorrentResultArray } from '@server/test-utils/ncore';
import { getRandomString } from '@server/test-utils/random';
import type { NockHandler } from '@server/test-utils/types';
import nock from 'nock';
import type { Mock, MockInstance } from 'vitest';

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
  let loginRequestSpy: Mock<NockHandler>;
  let indexPhpRequestSpy: Mock<NockHandler>;
  let torrentsRequestSpy: Mock<NockHandler>;
  let hitnrunRequestSpy: Mock<NockHandler>;
  let downloadAndParseTorrentSpy: MockInstance<
    typeof torrentFileUtils.downloadAndParseTorrent
  >;

  beforeEach(() => {
    loginRequestSpy = vi.fn();
    indexPhpRequestSpy = vi.fn();
    torrentsRequestSpy = vi.fn();
    hitnrunRequestSpy = vi.fn();
    downloadAndParseTorrentSpy = vi.spyOn(torrentFileUtils, 'downloadAndParseTorrent');
    ncoreService = new NcoreService();
    nock(env.NCORE_URL)
      .post('/login.php')
      .reply(function (uri, requestBody) {
        return loginRequestSpy({ uri, body: requestBody });
      })
      .persist();
    nock(env.NCORE_URL)
      .get('/index.php')
      .reply(function (uri, requestBody) {
        return indexPhpRequestSpy({ uri, body: requestBody });
      })
      .persist();
    nock(env.NCORE_URL)
      .get('/torrents.php')
      .query(true)
      .reply(function (uri, requestBody) {
        return torrentsRequestSpy({ uri, body: requestBody });
      })
      .persist();
    nock(env.NCORE_URL)
      .get('/hitnrun.php')
      .query(true)
      .reply(function (uri, requestBody) {
        return hitnrunRequestSpy({ uri, body: requestBody });
      })
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
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
      loginRequestSpy.mockResolvedValue([
        302,
        '',
        {
          Location: `index.php`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Set-Cookie': [
            `nick=${username}; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            `pass=${passCookieValue}; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            `nyelv=hu; expires=${expirationDateString}; Max-Age=2592000; path=/`,
          ],
        },
      ]);

      const cookies = await ncoreService['_getCookies']();

      expect(loginRequestSpy).toHaveBeenCalledOnce();
      expect(loginRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: '/login.php',
          body: expect.any(String),
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

      expect(loginRequestSpy).not.toHaveBeenCalled();
      expect(cookies).toBe(cachedCookies);
    });

    it('should fetch new cookies if cached cookies are expired', async () => {
      const cachedCookies = 'nick=cachedUser; pass=cachedPass; nyelv=hu';
      ncoreService['_cookiesCache'].pass = cachedCookies;
      ncoreService['_cookiesCache'].cookieExpirationDate = Date.now() - ONE_DAY_MS;

      const newPassCookieValue = getRandomString(32);
      const expirationDate = Date.now() + 30 * ONE_DAY_MS;
      const expirationDateString = new Date(expirationDate).toUTCString();
      loginRequestSpy.mockResolvedValueOnce([
        302,
        '',
        {
          Location: `index.php`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Set-Cookie': [
            `nick=newUser; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            `pass=${newPassCookieValue}; expires=${expirationDateString}; Max-Age=2592000; path=/; secure; HttpOnly`,
            `nyelv=hu; expires=${expirationDateString}; Max-Age=2592000; path=/`,
          ],
        },
      ]);

      const cookies = await ncoreService['_getCookies']();

      expect(loginRequestSpy).toHaveBeenCalledTimes(1);
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
      loginRequestSpy.mockResolvedValueOnce([
        302,
        'Invalid credentials',
        {
          Location: `login.php?problema=1&set_lang=hu`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Set-Cookie': [
            `nick=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0; path=/`,
            `pass=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; Max-Age=0; path=/`,
            `nyelv=hu; path=/`,
          ],
        },
      ]);

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
      torrentsRequestSpy.mockImplementation(() => {
        return [
          200,
          {
            results: mockTorrentsResults,
            total_results: '8',
            onpage: 8,
            perpage: '8',
          } satisfies NcorePageResponseJson,
        ];
      });

      const torrents = await ncoreService['_getTorrentsForQuery']({
        kivalasztott_tipus: MOVIE_CATEGORY_FILTERS,
        miben: NcoreSearchBy.IMDB,
        miszerint: NcoreOrderBy.SEEDERS,
        mire: imdbId,
      });

      expect(getAllPagesSpy).toHaveBeenCalledOnce();
      expect(torrentsRequestSpy).toHaveBeenCalledTimes(1);
      expect(torrentsRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: expect.stringContaining(`/torrents.php?`),
        }),
      );
      expect(torrents).toEqual(mockTorrentsResults);
    });

    it('should not throw error when request fails', async () => {
      const imdbId = 'tt1375666';
      torrentsRequestSpy.mockImplementation(() => {
        return [500, 'Internal Server Error'];
      });

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
      expect(vi.mocked(logger).warn).toHaveBeenCalledOnce();
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
      torrentsRequestSpy.mockImplementation(() => [200, torrentDetailMockHtml]);

      const downloadUrl = await ncoreService.getTorrentUrlByNcoreId(ncoreId);

      expect(downloadUrl).toBe(
        `https://ncore.pro/torrents.php?action=download&id=${ncoreId}&key=mockkey`,
      );
    });
  });

  describe('getRemovableInfoHashes', () => {
    it('should return info hashes that are not required to seed anymore', async () => {
      vi.spyOn(ncoreService, '_getCookies').mockResolvedValue(
        'nick=test-user; pass=valid_cookie_value; nyelv=hu',
      );
      hitnrunRequestSpy.mockImplementation(() => [200, hitNRunMockHtml]);
      vi.spyOn(ncoreService, 'getTorrentUrlByNcoreId').mockImplementation(
        async (ncoreId) => {
          return `${env.NCORE_URL}/torrents.php?action=download&id=${ncoreId}&key=mockkey`;
        },
      );
      downloadAndParseTorrentSpy.mockImplementation(async (downloadUrl: string) => {
        const ncoreId = new URL(downloadUrl).searchParams.get('id')!;
        const idToInfohashMap: Record<string, string> = {
          '4038421': '1234567890abcdef1234567890abcdef12345678',
          '2218906': '1234567890abcdef1234567890abcdef12345678',
          '3924062': '1234567890abcdef1234567890abcdef12345678',
          '3110978': '1234567890abcdef1234567890abcdef12345678',
          '1020578': '1234567890abcdef1234567890abcdef12345678',
          '1251007': '1234567890abcdef1234567890abcdef12345678',
          '3248015': '1234567890abcdef1234567890abcdef12345678',
          '4046786': '1234567890abcdef1234567890abcdef12345678',
          '4046789': '1234567890abcdef1234567890abcdef12345678',
          '4046791': '1234567890abcdef1234567890abcdef12345678',
          '4051126': '1234567890abcdef1234567890abcdef12345678',
          '4050710': '1234567890abcdef1234567890abcdef12345678',
          '4040794': '1234567890abcdef1234567890abcdef12345678',
          '4031621': '1234567890abcdef1234567890abcdef12345678',
          '4031620': '1234567890abcdef1234567890abcdef12345678',
          '1496568': '1234567890abcdef1234567890abcdef12345678',
          '965327': '1234567890abcdef1234567890abcdef12345678',
          '1496569': '1234567890abcdef1234567890abcdef12345678',
          '4046776': '1234567890abcdef1234567890abcdef12345678',
          '4046778': '1234567890abcdef1234567890abcdef12345678',
          '4050994': '1234567890abcdef1234567890abcdef12345678',
          '3037290': '1234567890abcdef1234567890abcdef12345678',
          '3037289': '1234567890abcdef1234567890abcdef12345678',
          '3868339': '1234567890abcdef1234567890abcdef12345678',
          '3868344': '1234567890abcdef1234567890abcdef12345678',
        };
        return {
          torrentFileData: { infoHash: idToInfohashMap[ncoreId] } as ParsedTorrentDetails,
          torrentBuffer: Buffer.from([]),
        };
      });

      const removableInfoHashes = await ncoreService.getRemovableInfoHashes();

      expect(hitnrunRequestSpy).toHaveBeenCalledOnce();
      expect(hitnrunRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: expect.stringContaining(`/hitnrun.php?showall=true`),
        }),
      );

      expect(removableInfoHashes).toEqual([
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
        '1234567890abcdef1234567890abcdef12345678',
      ]);
    });
  });
});

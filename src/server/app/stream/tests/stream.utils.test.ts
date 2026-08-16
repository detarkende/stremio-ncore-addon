import { Language, type Resolution } from '@server/app/user/user.types';
import { env } from '@server/env';
import type { NockHandler } from '@server/test-utils/types';
import nock from 'nock';
import type { Mock } from 'vitest';

import type {
  TorrentDetails,
  ParsedTorrentFileDetails,
} from '../../torrent/torrent.types';
import { StreamType } from '../stream.constants';
import type { CinemetaResponse } from '../stream.schema';
import {
  convertTorrentToStream,
  getCinemetaData,
  getStreamDescription,
  orderTorrents,
} from '../stream.utils';

describe('Stream utils', () => {
  describe('getCinemetaData', () => {
    const cinemetaRequestHandler: Mock<NockHandler> = vi.fn();

    beforeEach(() => {
      nock.disableNetConnect();
      nock(`${env.CINEMETA_URL}`)
        .persist()
        .get(/\/meta\/(movie|series)\/tt\d+\.json$/)
        .reply(function (uri, requestBody) {
          return cinemetaRequestHandler({ uri, body: requestBody });
        });
      cinemetaRequestHandler.mockReset();
    });

    describe('successful responses', () => {
      it.each([
        {
          type: StreamType.MOVIE,
          response: {
            meta: { type: StreamType.MOVIE, imdb_id: 'tt1234567', name: `Example Movie` },
          } satisfies CinemetaResponse,
        },
        {
          type: StreamType.TV_SHOW,
          response: {
            meta: {
              type: StreamType.TV_SHOW,
              imdb_id: 'tt1234567',
              name: `Example show`,
            },
          } satisfies CinemetaResponse,
        },
      ])('should return valid CinemetaResponse for %type', async ({ type, response }) => {
        cinemetaRequestHandler.mockResolvedValueOnce([200, response]);

        const data = await getCinemetaData(type, 'tt1234567');
        expect(data).toEqual(response);
      });
    });

    it('should throw an error for failed responses', async () => {
      cinemetaRequestHandler.mockResolvedValueOnce([500, 'Internal Server Error']);

      await expect(getCinemetaData(StreamType.MOVIE, 'tt1234567')).rejects.toThrow(
        'Error fetching metadata from Cinemeta',
      );
    });

    it('should throw an error for invalid responses', async () => {
      cinemetaRequestHandler.mockResolvedValueOnce([200, { invalid: 'data' }]);

      await expect(getCinemetaData(StreamType.MOVIE, 'tt1234567')).rejects.toThrow(
        'Error fetching metadata from Cinemeta',
      );
    });
  });

  describe('getStreamDescription', () => {
    describe.each(Object.values(Language))('displayLanguage is $0', (displayLanguage) => {
      describe.each(Object.values(Language))(
        'torrentLanguage is $0',
        (torrentLanguage) => {
          describe.each([true, false])('isRecommended is %s', (isRecommended) => {
            describe.each([true, false])('isSpeculated is %s', (isSpeculated) => {
              it('should return correct description', () => {
                const description = getStreamDescription({
                  displayLanguage,
                  torrentLanguage,
                  fileName: 'Example.Movie.mkv',
                  fileSize: 1234567890,
                  isRecommended,
                  isSpeculated,
                  resolution: 'HD (720p)',
                  seeders: 150,
                });

                expect(description).toMatchSnapshot();
              });
            });
          });
        },
      );
    });
  });

  describe('orderTorrents', () => {
    it('should prefer matching language and resolution', () => {
      const preferredResolution = 'HD (720p)' as Resolution;
      const file = {
        name: 'movie.mkv',
        path: 'movie.mkv',
        length: 1,
        offset: 0,
      } satisfies ParsedTorrentFileDetails;
      const createTorrent = (language: Language, resolution: Resolution) =>
        ({
          getLanguage: () => language,
          getSearchedFile: () => file,
          getFileResolution: () => resolution,
        }) as unknown as TorrentDetails;
      const preferredTorrent = createTorrent(Language.EN, preferredResolution);
      const otherTorrent = createTorrent(Language.HU, 'SD' as Resolution);

      expect(
        orderTorrents({
          torrents: [otherTorrent, preferredTorrent],
          preferences: {
            preferredLanguage: Language.EN,
            preferredResolutions: [preferredResolution],
          },
          type: StreamType.MOVIE,
          season: '',
          episode: '',
        }),
      ).toEqual([preferredTorrent, otherTorrent]);
    });
  });

  describe('convertTorrentToStream', () => {
    it('should return a stream with playback metadata and URL', () => {
      const file = {
        name: 'Movie.720p.mkv',
        path: 'Movie.720p.mkv',
        length: 1024,
        offset: 0,
      } satisfies ParsedTorrentFileDetails;
      const torrent = {
        infoHash: 'abc123',
        sourceId: 'source-1',
        sourceName: 'ncore',
        files: [file],
        isSpeculated: false,
        getLanguage: () => Language.EN,
        getFileResolution: () => 'HD (720p)' as Resolution,
        displayResolution: (resolution: Resolution) => resolution,
        getSeeders: () => 42,
      };

      const stream = convertTorrentToStream({
        torrent: torrent as unknown as TorrentDetails,
        token: 'token',
        file,
        isRecommended: true,
        addonUrl: 'https://addon.example',
        preferredLanguage: Language.EN,
        type: StreamType.MOVIE,
        imdbId: 'tt1234567',
      });

      expect(stream).toMatchObject({
        infoHash: 'abc123',
        fileIdx: 0,
        name: 'stremio-ncore-addon',
        behaviorHints: {
          filename: file.name,
          videoSize: file.length,
        },
      });
      expect(stream.url).toContain('/api/auth/token/stream');
      expect(stream.url).toContain('torrentSourceId=source-1');
      expect(stream.description).toContain('Recommended');
    });
  });
});

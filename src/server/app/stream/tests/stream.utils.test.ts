import { Language } from '@server/app/user/user.types';
import { env } from '@server/env';
import type { NockHandler } from '@server/test-utils/types';
import nock from 'nock';
import type { Mock } from 'vitest';

import { StreamType } from '../stream.constants';
import type { CinemetaResponse } from '../stream.schema';
import { getCinemetaData, getStreamDescription } from '../stream.utils';

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
});

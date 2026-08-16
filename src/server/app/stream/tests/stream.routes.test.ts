import { configureApp } from '@server/test-utils/config';
import { createTestUser, createTestUserWithSession } from '@server/test-utils/users';
import { testClient } from 'hono/testing';
import type { Stream } from 'stremio-addon-sdk';

import type { NcoreTorrent } from '../../ncore';
import { ncoreService } from '../../ncore';
import * as torrentFileUtils from '../../torrent/torrent-file.utils';
import { StreamType } from '../stream.constants';
import { streamRoutes } from '../stream.routes';
import * as streamUtils from '../stream.utils';

describe('Stream routes', () => {
  const client = testClient(streamRoutes);

  const getTorrentsForQuerySpy = vi.spyOn(ncoreService, '_getTorrentsForQuery');
  const getCinemetaDataSpy = vi.spyOn(streamUtils, 'getCinemetaData');
  const downloadAndParseTorrentSpy = vi.spyOn(
    torrentFileUtils,
    'downloadAndParseTorrent',
  );

  describe('GET /auth/:token/stream/:type/:imdbId', () => {
    beforeEach(() => {
      configureApp();
    });
    it('should return 401 for invalid token', async () => {
      const response = await client.api.auth[':token'].stream[':type'][':imdbId'].$get({
        param: { type: StreamType.MOVIE, imdbId: 'tt1234567', token: 'invalidToken' },
      });
      expect(response.status).toBe(401);
    });

    it('should return a list of torrents for a valid request', async () => {
      const user = await createTestUser();
      const mockTorrents: NcoreTorrent[] = [
        {
          type: 'movie',
          torrent_id: '1234567',
          release_name: 'The.Movie.2026.1080p.BluRay.x264',
          imdb_id: 'tt1234567',
          download_url: 'https://ncore.cc/torrents/download/1234567',
          size: '1234567890',
          category: 'hd_hun',
          details_url: 'https://ncore.cc/torrents/details/1234567',
          freeleech: true,
          seeders: '100',
          leechers: '10',
          imdb_rating: '8.5',
        },
      ];

      getTorrentsForQuerySpy.mockResolvedValueOnce(mockTorrents);
      downloadAndParseTorrentSpy.mockResolvedValueOnce({
        torrentBuffer: Buffer.from('mock torrent data'),
        torrentFileData: {
          name: 'The.Movie.2026.1080p.BluRay.x264',
          infoHash: 'abcdef1234567890abcdef1234567890abcdef12',
          files: [
            {
              name: 'The.Movie.2026.1080p.BluRay.x264.mkv',
              path: 'The.Movie.2026.1080p.BluRay.x264/The.Movie.2026.1080p.BluRay.x264.mkv',
              length: 1234567890,
              offset: 0,
            },
          ],
        },
      });

      const response = await client.api.auth[':token'].stream[':type'][':imdbId'].$get({
        param: { type: StreamType.MOVIE, imdbId: 'tt1234567', token: user.token },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        streams: [
          {
            behaviorHints: {
              bingeGroup: 'stremio-ncore-addon/ncore/1234567',
              filename: 'The.Movie.2026.1080p.BluRay.x264.mkv',
              notWebReady: true,
              videoSize: 1234567890,
            },
            description:
              '⭐️ Recommended\n🇭🇺 | HD (1080P) | 1.15 GiB\nThe.Movie.2026.1080p.BluRay.x264.mkv\n⬆️ 100',
            fileIdx: 0,
            infoHash: 'abcdef1234567890abcdef1234567890abcdef12',
            name: 'stremio-ncore-addon',
            url: expect.stringMatching(
              /\/api\/auth\/[A-Za-z0-9]+\/stream\?type=movie&imdbId=tt1234567&torrentSourceId=1234567&infoHash=abcdef1234567890abcdef1234567890abcdef12&filePath=The\.Movie\.2026\.1080p\.BluRay\.x264%2FThe\.Movie\.2026\.1080p\.BluRay\.x264\.mkv$/,
            ),
          },
        ],
      });
    });
  });
});

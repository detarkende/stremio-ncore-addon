import { db } from '@server/db';
import { torrentsTable } from '@server/db/schema';
import { configureApp } from '@server/test-utils/config';
import { createTestUser } from '@server/test-utils/users';
import { testClient } from 'hono/testing';

import type { NcoreTorrent } from '../../ncore';
import { ncoreService } from '../../ncore';
import { torrentClient, type Torrent } from '../../torrent';
import * as torrentFileUtils from '../../torrent/torrent-file.utils';
import { StreamType } from '../stream.constants';
import { streamRoutes } from '../stream.routes';
import * as streamUtils from '../stream.utils';

describe('Stream routes', () => {
  const client = testClient(streamRoutes);

  const getTorrentsForQuerySpy = vi.spyOn(ncoreService, '_getTorrentsForQuery');
  const getTorrentUrlByNcoreIdSpy = vi.spyOn(ncoreService, 'getTorrentUrlByNcoreId');
  const getCinemetaDataSpy = vi.spyOn(streamUtils, 'getCinemetaData');
  const downloadAndParseTorrentSpy = vi.spyOn(
    torrentFileUtils,
    'downloadAndParseTorrent',
  );
  const getTorrentSpy = vi.spyOn(torrentClient, 'getTorrent');
  const addTorrentSpy = vi.spyOn(torrentClient, 'addTorrent');

  const torrentInfoHash = 'abcdef1234567890abcdef1234567890abcdef12';
  const torrentFilePath = 'The.Movie.2026/The.Movie.2026.mkv';
  const torrentFileData = {
    name: 'The.Movie.2026',
    infoHash: torrentInfoHash,
    files: [
      {
        name: 'The.Movie.2026.mkv',
        path: torrentFilePath,
        length: 1024,
        offset: 0,
      },
    ],
  };

  function createStreamTorrent(): Torrent {
    return {
      infoHash: torrentInfoHash,
      name: torrentFileData.name,
      progress: 0,
      size: 1024,
      downloaded: 0,
      path: '/downloads',
      files: [
        {
          name: torrentFileData.files[0].name,
          path: torrentFilePath,
          size: torrentFileData.files[0].length,
          progress: 0,
          getStream: () =>
            new ReadableStream<Uint8Array>({
              start(controller) {
                controller.close();
              },
            }),
        },
      ],
    };
  }

  function getStreamUrl(token: string): string {
    const query = new URLSearchParams({
      type: StreamType.MOVIE,
      imdbId: 'tt1234567',
      torrentSourceId: '1234567',
      infoHash: torrentInfoHash,
      filePath: torrentFilePath,
    });
    return `/api/auth/${token}/stream?${query}`;
  }

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

  describe('HEAD and GET /auth/:token/stream', () => {
    beforeEach(() => {
      configureApp();
      getTorrentUrlByNcoreIdSpy.mockResolvedValue('https://ncore.test/torrent');
      downloadAndParseTorrentSpy.mockResolvedValue({
        torrentBuffer: Buffer.from('mock torrent data'),
        torrentFileData,
      });
    });

    it('does not add a torrent on HEAD, then adds it once on GET', async () => {
      const user = await createTestUser();
      getTorrentSpy.mockResolvedValue(null);
      addTorrentSpy.mockResolvedValue(createStreamTorrent());

      const headResponse = await streamRoutes.request(getStreamUrl(user.token), {
        method: 'HEAD',
      });

      expect(headResponse.status).toBe(200);
      expect(headResponse.headers.get('Content-Length')).toBe('1024');
      expect(addTorrentSpy).not.toHaveBeenCalled();
      expect(db.select().from(torrentsTable).all()).toHaveLength(0);

      const getResponse = await streamRoutes.request(getStreamUrl(user.token));

      expect(getResponse.status).toBe(206);
      expect(addTorrentSpy).toHaveBeenCalledTimes(1);
      expect(db.select().from(torrentsTable).all()).toHaveLength(1);
    });

    it('initializes a torrent only once for concurrent GET requests', async () => {
      const user = await createTestUser();
      getTorrentSpy.mockResolvedValue(null);
      addTorrentSpy.mockResolvedValue(createStreamTorrent());

      const [firstResponse, secondResponse] = await Promise.all([
        streamRoutes.request(getStreamUrl(user.token)),
        streamRoutes.request(getStreamUrl(user.token)),
      ]);

      expect(firstResponse.status).toBe(206);
      expect(secondResponse.status).toBe(206);
      expect(getTorrentUrlByNcoreIdSpy).toHaveBeenCalledTimes(1);
      expect(downloadAndParseTorrentSpy).toHaveBeenCalledTimes(1);
      expect(addTorrentSpy).toHaveBeenCalledTimes(1);
      expect(db.select().from(torrentsTable).all()).toHaveLength(1);
    });
  });
});

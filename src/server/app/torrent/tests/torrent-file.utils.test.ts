import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';

import { logger } from '@server/logger';
import mentalistMock from '@server/mocks/torrents/mentalist';
import { fetchMock } from '@server/test-utils/fetch-mock';
import * as undici from 'undici';

import { fetchTorrent, downloadAndParseTorrent } from '../torrent-file.utils';

describe('Torrent file utils', () => {
  const TORRENT_URL = `http://example.com/test.torrent`;
  const SAMPLE_TORRENT_BUFFER = mentalistMock.torrentBuffer;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchTorrent', () => {
    it('should fetch torrent file from URL', async () => {
      fetchMock.mockResolvedValue(new Response(SAMPLE_TORRENT_BUFFER, { status: 200 }));

      const { torrentBuffer } = await fetchTorrent(TORRENT_URL);
      expect(fetchMock).toHaveBeenCalledWith(
        TORRENT_URL,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          dispatcher: expect.any(Object),
        }),
      );
      expect(torrentBuffer).toEqual(SAMPLE_TORRENT_BUFFER);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      fetchMock.mockResolvedValue(new Response('Not found', { status: 404 }));

      await expect(fetchTorrent(TORRENT_URL)).rejects.toThrow(
        `Failed to fetch torrent from URL ${TORRENT_URL}`,
      );
      const loggerErrorMock = vi.mocked(logger.error);
      expect(loggerErrorMock).toHaveBeenCalledTimes(1);
      expect(loggerErrorMock.mock.calls[0]).toMatchInlineSnapshot(`
        [
          "Failed to fetch torrent from URL http://example.com/test.torrent",
          {
            "error": [Error: Failed to fetch torrent from URL http://example.com/test.torrent. Status: 404],
          },
        ]
      `);
    });
  });

  describe('torrent download retries', () => {
    let server: Server;
    let origin: string;
    let statuses: number[];
    let requests: number;
    let requestTimes: number[];
    let retryAfter: string | undefined;

    beforeAll(async () => {
      server = createServer((_request, response) => {
        const status = statuses[Math.min(requests, statuses.length - 1)];
        requests += 1;
        requestTimes.push(Date.now());
        if (retryAfter && status !== 200) {
          response.setHeader('retry-after', retryAfter);
        }
        response.writeHead(status, { 'cache-control': 'public, max-age=60' });
        response.end(status === 200 ? SAMPLE_TORRENT_BUFFER : 'error');
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected the test server to have a TCP address');
      }
      origin = `http://127.0.0.1:${address.port}`;
    });

    beforeEach(async () => {
      requests = 0;
      requestTimes = [];
      retryAfter = undefined;
      const actual = await vi.importActual<typeof undici>('undici');
      vi.mocked(undici.fetch).mockImplementation(actual.fetch);
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    });

    it('retries a 503 and caches the successful response', async () => {
      statuses = [503, 200];
      const url = `${origin}/${randomUUID()}`;

      await expect(fetchTorrent(url)).resolves.toEqual({
        torrentBuffer: SAMPLE_TORRENT_BUFFER,
      });
      await expect(fetchTorrent(url)).resolves.toEqual({
        torrentBuffer: SAMPLE_TORRENT_BUFFER,
      });
      expect(requests).toBe(2);
    });

    it('stops after two retries and does not cache the failed response', async () => {
      statuses = [503, 503, 503, 200];
      const url = `${origin}/${randomUUID()}`;

      await expect(fetchTorrent(url)).rejects.toMatchObject({
        cause: { cause: { statusCode: 503 } },
      });
      expect(requests).toBe(3);

      await expect(fetchTorrent(url)).resolves.toEqual({
        torrentBuffer: SAMPLE_TORRENT_BUFFER,
      });
      expect(requests).toBe(4);
    });

    it('waits for the Retry-After delay before retrying', async () => {
      statuses = [503, 200];
      retryAfter = '2';

      await expect(fetchTorrent(`${origin}/${randomUUID()}`)).resolves.toEqual({
        torrentBuffer: SAMPLE_TORRENT_BUFFER,
      });
      expect(requests).toBe(2);
      expect(requestTimes[1] - requestTimes[0]).toBeGreaterThanOrEqual(2000);
    });

    it('times out rather than retrying before a longer Retry-After delay', async () => {
      statuses = [503, 200];
      retryAfter = '10';

      await expect(fetchTorrent(`${origin}/${randomUUID()}`)).rejects.toMatchObject({
        cause: { name: 'TimeoutError' },
      });
      expect(requests).toBe(1);
    }, 8000);

    it('does not retry a 404 response', async () => {
      statuses = [404];

      await expect(fetchTorrent(`${origin}/${randomUUID()}`)).rejects.toThrow();
      expect(requests).toBe(1);
    });
  });

  describe('downloadAndParseTorrent', () => {
    it('should download and parse torrent file from URL', async () => {
      fetchMock.mockResolvedValue(new Response(SAMPLE_TORRENT_BUFFER, { status: 200 }));

      const { torrentBuffer, torrentFileData } =
        await downloadAndParseTorrent(TORRENT_URL);

      expect(torrentBuffer).toEqual(SAMPLE_TORRENT_BUFFER);
      expect(torrentFileData).toEqual({
        infoHash: 'd5a72a1c05562d114adbc518e522d92826d53294',
        name: 'The.Mentalist.S01-S07.COMPLETE.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland',
        files: expect.any(Array),
      });
      expect(torrentFileData.files).toHaveLength(151);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

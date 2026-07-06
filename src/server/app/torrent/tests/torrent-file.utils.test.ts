import { logger } from '@server/logger';
import mentalistMock from '@server/mocks/torrents/mentalist';
import type { NockHandler } from '@server/test-utils/types';
import nock from 'nock';
import type { Mock } from 'vitest';

import { _fetchTorrent, downloadAndParseTorrent } from '../torrent-file.utils';

vi.mock('@server/utils/cache', async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importActual<typeof import('@server/utils/cache')>();
  return {
    ...actual,
    cacheFunction: (_options: unknown, fn: typeof _fetchTorrent) => fn,
  };
});

describe('Torrent file utils', () => {
  const BASE_URL = 'http://example.com';
  const ENDPOINT = '/test.torrent';
  const TORRENT_URL = `${BASE_URL}${ENDPOINT}`;
  const SAMPLE_TORRENT_BUFFER = mentalistMock.torrentBuffer;
  const torrentFileRequestHandler: Mock<NockHandler> = vi.fn();

  beforeEach(() => {
    nock.disableNetConnect();
    nock(BASE_URL)
      .get(ENDPOINT)
      .reply((uri, body) => {
        return torrentFileRequestHandler({ uri, body });
      });
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    vi.resetAllMocks();
  });

  describe('_fetchTorrent', () => {
    it('should fetch torrent file from URL', async () => {
      torrentFileRequestHandler.mockResolvedValueOnce([200, SAMPLE_TORRENT_BUFFER]);

      const { torrentBuffer } = await _fetchTorrent(TORRENT_URL);
      expect(torrentBuffer).toEqual(SAMPLE_TORRENT_BUFFER);
      expect(torrentFileRequestHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      torrentFileRequestHandler.mockResolvedValueOnce([404, 'Not Found']);

      await expect(_fetchTorrent(TORRENT_URL)).rejects.toThrow(
        `Failed to fetch torrent from URL ${TORRENT_URL}`,
      );
      const loggerErrorMock = vi.mocked(logger.error);
      expect(loggerErrorMock).toHaveBeenCalledTimes(1);
      expect(loggerErrorMock.mock.calls[0]).toMatchInlineSnapshot(`[
  {
    "error": [Error: Failed to fetch torrent from URL http://example.com/test.torrent. Status: 404],
  },
  "Failed to fetch torrent from URL http://example.com/test.torrent",
]`);
    });
  });

  describe('downloadAndParseTorrent', () => {
    it('should download and parse torrent file from URL', async () => {
      torrentFileRequestHandler.mockResolvedValueOnce([200, mentalistMock.torrentBuffer]);

      const { torrentBuffer, torrentFileData } =
        await downloadAndParseTorrent(TORRENT_URL);

      expect(torrentBuffer).toEqual(SAMPLE_TORRENT_BUFFER);
      expect(torrentFileData).toEqual({
        infoHash: 'd5a72a1c05562d114adbc518e522d92826d53294',
        name: 'The.Mentalist.S01-S07.COMPLETE.1080p.AMZN.WEB-DL.DDP5.1.H.264.HUN.ENG-pcroland',
        files: expect.any(Array),
      });
      expect(torrentFileData.files).toHaveLength(151);
      expect(torrentFileRequestHandler).toHaveBeenCalledTimes(1);
    });
  });
});

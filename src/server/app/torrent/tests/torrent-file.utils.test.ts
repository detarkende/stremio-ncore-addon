import { logger } from '@server/logger';
import mentalistMock from '@server/mocks/torrents/mentalist';
import { fetchMock } from '@server/test-utils/fetch-mock';

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

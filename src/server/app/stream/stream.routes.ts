import { zValidator } from '@hono/zod-validator';
import { logger } from '@server/logger';
import { HttpStatusCode } from '@server/types/http';
import { parseRangeHeader } from '@server/utils/parse-range-header';
import { getCurrentRequestUrl } from '@server/utils/url';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getMimeType } from 'hono/utils/mime';

import { useUrlTokenAuth } from '../auth/auth.middleware';
import { useIsConfigured } from '../config/config.middleware';
import { ncoreService } from '../ncore/index';
import {
  downloadAndParseTorrent,
  type TorrentDetails,
  type TorrentFileDetails,
  torrentClient,
} from '../torrent/index';
import { insertNewTorrent, insertUserTorrentFileRecord } from '../torrent/torrent.utils';
import {
  listStreamsParamsSchema,
  playStreamParamsSchema,
  type CinemetaResponse,
} from './stream.constants';
import { convertTorrentToStream, getCinemetaData, orderTorrents } from './stream.utils';

export const streamRoutes = new Hono()
  .basePath('/api')
  .get(
    '/auth/:token/stream/:type/:imdbId',
    useUrlTokenAuth(),
    useIsConfigured(),
    zValidator('param', listStreamsParamsSchema),
    async (c) => {
      const { token } = c.req.param();
      const { type, imdbId: imdbIdWithEpisodeDetails } = c.req.valid('param');
      const [imdbId, season, episode] = imdbIdWithEpisodeDetails.split(':');

      let torrentDetails: TorrentDetails[] = await ncoreService.getTorrentsByImdbId({
        type,
        imdbId,
      });
      torrentDetails = torrentDetails.filter(
        (torrent) => torrent.getSearchedFile({ type, season, episode }) !== null,
      );
      if (torrentDetails.length === 0) {
        let cinemetaData: CinemetaResponse | null = null;
        try {
          cinemetaData = await getCinemetaData(type, imdbId);
        } catch (error) {
          logger.warn({ error }, 'Failed to fetch metadata from Cinemeta');
        }
        if (cinemetaData) {
          try {
            const torrentsByTitle = await ncoreService.getTorrentsByTitle({
              type,
              title: cinemetaData.meta.name,
            });
            torrentDetails = torrentsByTitle.filter(
              (torrent) => torrent.getSearchedFile({ type, season, episode }) !== null,
            );
          } catch (error) {
            logger.warn({ error }, 'Failed to fetch torrents by title');
          }
        }
      }

      torrentDetails = orderTorrents({
        torrents: torrentDetails,
        preferences: c.var.user,
        season,
        episode,
        type,
      });

      const addonUrl = getCurrentRequestUrl(c.req.url, c.var.config);

      const streams = torrentDetails.map((torrent, i) =>
        convertTorrentToStream({
          torrent,
          token,
          file: torrent.getSearchedFile({ type, season, episode }) as TorrentFileDetails,
          isRecommended: i === 0,
          addonUrl,
          preferredLanguage: c.var.user.preferredLanguage,
          imdbId,
          type,
        }),
      );

      return c.json({ streams });
    },
  )
  .get(
    '/auth/:token/stream',
    useIsConfigured(),
    useUrlTokenAuth(),
    zValidator('query', playStreamParamsSchema),
    async (c) => {
      const { type, imdbId, torrentSourceId, infoHash, filePath } = c.req.valid('query');

      let torrent = await torrentClient.getTorrent(infoHash);
      if (!torrent) {
        const ncoreUrl = await ncoreService.getTorrentUrlByNcoreId(torrentSourceId);
        const { torrentFileData, torrentBuffer } =
          await downloadAndParseTorrent(ncoreUrl);
        const dbTorrent = insertNewTorrent({
          userId: c.var.user.id,
          imdbId,
          torrentFileData,
          torrentBuffer,
          type,
        });
        torrent = await torrentClient.addTorrent(dbTorrent, true);
      } else {
        // Log user-torrent association if not already present
        insertUserTorrentFileRecord({
          userId: c.var.user.id,
          torrentInfoHash: infoHash,
        });
      }

      const file = torrent.files.find((f) => f.path === filePath);

      if (!file) {
        logger.error(
          { infoHash, torrentName: torrent.name, filePath },
          `File not found in torrent when trying to play`,
        );
        throw new HTTPException(HttpStatusCode.NOT_FOUND);
      }
      const fileType = getMimeType(file.path) || 'application/octet-stream';

      if (c.req.method === 'HEAD') {
        return c.body(null, 200, {
          'Content-Length': `${file.size}`,
          'Content-Type': fileType,
        });
      }

      const range = parseRangeHeader(c.req.header('range'), file.size);
      const stream = file.getStream(range);
      return new Response(stream, {
        status: HttpStatusCode.PARTIAL_CONTENT,
        headers: {
          'Content-Range': `bytes ${range.start}-${range.end}/${file.size}`,
          'Content-Length': `${range.end - range.start + 1}`,
          'Content-Type': fileType,
          'Accept-Ranges': 'bytes',
        },
      });
    },
  );

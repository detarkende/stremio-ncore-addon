import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import mime from 'mime';
import { streamQuerySchema } from '@/schemas/stream.schema';
import type { TorrentService } from '@/services/torrent';
import type { StreamService } from '@/services/stream';
import type { UserService } from '@/services/user';
import type { TorrentStoreService } from '@/services/torrent-store';
import type { User } from '@/schemas/user.schema';
import { isSupportedMedia } from '@/utils/media-file-extensions';
import { playSchema } from '@/schemas/play.schema';
import { parseRangeHeader } from '@/utils/parse-range-header';
import { HttpStatusCode } from '@/types/http';
import type { ITorrentSourceManager, TorrentDetails } from '@/services/torrent-source/types';

export class StreamController {
  constructor(
    private torrentSource: ITorrentSourceManager,
    private torrentService: TorrentService,
    private streamService: StreamService,
    private userService: UserService,
    private torrentStoreService: TorrentStoreService,
  ) {}

  public async getStreamsForMedia(c: Context) {
    const params = c.req.param();
    const result = streamQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { imdbId, type, episode, season, jwt } = result.data;

    let user: User;
    try {
      user = await this.userService.getUserByJwt(jwt);
    } catch {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
        message: 'Unauthorized',
      });
    }

    const torrents = await this.torrentSource.getTorrentsForImdbId({
      imdbId,
      type,
    });

    const torrentsWithMetadata: TorrentDetails[] = torrents.filter((torrent) => {
      const file = torrent.files[torrent.getMediaFileIndex({ season, episode })];
      return file !== undefined && isSupportedMedia(file.path);
    });

    // TODO: remove the type FullTorrent, since the fileIndex and resolution can now be calculated from the TorrentDetails directly. We were spreading TorrentDetails to create FullTorrent, but I think the methods got lost that way or something.

    const orderedTorrents = this.streamService.orderTorrents({
      torrents: torrentsWithMetadata,
      season,
      episode,
      user,
    });

    const streams = orderedTorrents.map((torrent, i) =>
      this.streamService.convertTorrentToStream({
        torrent,
        isRecommended: i === 0,
        jwt,
        season,
        episode,
      }),
    );

    return c.json({ streams });
  }

  public async play(c: Context) {
    const params = c.req.param();
    const result = playSchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { sourceName, sourceId, infoHash, fileIdx } = result.data;

    let torrent = await this.torrentStoreService.getTorrent(infoHash);

    if (!torrent) {
      const torrentUrl = await this.torrentSource.getTorrentUrlBySourceId({
        sourceId,
        sourceName,
      });
      if (!torrentUrl) {
        throw new HTTPException(HttpStatusCode.NOT_FOUND, {
          message: 'Torrent not found',
        });
      }
      const torrentFilePath = await this.torrentService.downloadTorrentFile(torrentUrl);
      torrent = await this.torrentStoreService.addTorrent(torrentFilePath);
    }

    const file = torrent.files[Number(fileIdx)]!;
    const fileType = mime.getType(file.path) || 'application/octet-stream';

    if (c.req.method === 'HEAD') {
      return c.body(null, 200, {
        'Content-Length': `${file.length}`,
        'Content-Type': fileType,
      });
    }

    const range = parseRangeHeader(c.req.header('range'), file.length);
    if (!range) {
      console.error(`Invalid range header: ${c.req.header('range')}`);
      return c.body(null, 416, {
        'Content-Range': `bytes */${file.length}`,
      });
    }
    const { start, end } = range;

    console.log(`Range: ${start}-${end}`);

    const stream = file.stream({ start, end });
    return new Response(stream);
  }
}

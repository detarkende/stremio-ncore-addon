import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import mime from 'mime';
import { streamQuerySchema } from '@/schemas/stream.schema';
import type { TorrentService } from '@/services/torrent';
import type { StreamService } from '@/services/stream';
import type { UserService } from '@/services/user';
import type { TorrentStoreService } from '@/services/torrent-store';
import type { FullTorrent } from '@/services/stream/types';
import type { User } from '@/schemas/user.schema';
import { isSupportedMedia } from '@/utils/media-file-extensions';
import { playSchema } from '@/schemas/play.schema';
import { parseRangeHeader } from '@/utils/parse-range-header';
import { HttpStatusCode } from '@/types/http';
import type { TorrentSource } from '@/services/torrent-source';

export class StreamController {
	constructor(
		private torrentSource: TorrentSource,
		private torrentService: TorrentService,
		private streamService: StreamService,
		private userService: UserService,
		private torrentStoreService: TorrentStoreService,
	) {}

	public async getStreamsForMedia(c: Context) {
		const params = c.req.param();
		const result = streamQuerySchema.safeParse(params);
		if (!result.success) {
			throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: result.error.message });
		}
		const { imdbId, type, episode, season, jwt } = result.data;

		let user: User;
		try {
			user = await this.userService.getUserByJwt(jwt);
		} catch (e) {
			throw new HTTPException(HttpStatusCode.UNAUTHORIZED, { message: 'Unauthorized' });
		}

		const torrents = await this.torrentSource.getTorrentsForImdbId({
			imdbId,
			type,
		});

		const torrentsWithMetadata: FullTorrent[] = torrents
			.map((torrent) => {
				const fileIndex = this.torrentService.getMediaFileIndex(torrent, {
					season,
					episode,
				});
				const resolution = this.torrentService.getResolution(
					torrent,
					torrent.files[fileIndex]?.name ?? '',
				);
				return {
					...torrent,
					fileIndex,
					resolution,
				};
			})
			.filter((torrent) => {
				const file = torrent.files[torrent.fileIndex];
				return file !== undefined && isSupportedMedia(file.path);
			});

		const orderedTorrents = this.streamService.orderTorrents({
			torrents: torrentsWithMetadata,
			user,
		});

		const streams = orderedTorrents.map((torrent, i) =>
			this.streamService.convertTorrentToStream({
				torrent,
				isRecommended: i === 0,
				jwt,
			}),
		);

		return c.json({ streams });
	}

	public async play(c: Context) {
		const params = c.req.param();
		const result = playSchema.safeParse(params);
		if (!result.success) {
			throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: result.error.message });
		}
		const { ncoreId, infoHash, fileIdx } = result.data;

		let torrent = await this.torrentStoreService.getTorrent(infoHash);

		if (!torrent) {
			const torrentUrl = await this.torrentSource.getTorrentUrlBySourceId(ncoreId);
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

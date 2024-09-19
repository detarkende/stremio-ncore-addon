import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import mime from 'mime';
import { streamQuerySchema } from '@/schemas/stream.schema';
import * as NcoreService from '@/services/ncore';
import * as TorrentService from '@/services/torrent';
import * as StreamService from '@/services/stream';
import * as UserService from '@/services/user';
import { TorrentStoreService } from '@/services/torrent-store';
import type { FullTorrent } from '@/services/stream/types';
import type { User } from '@/schemas/user.schema';
import { isSupportedMedia } from '@/utils/media-file-extensions';
import { playSchema } from '@/schemas/play.schema';
import { parseRangeHeader } from '@/utils/parse-range-header';
import { HttpStatusCode } from '@/types/http';

export const getStreamsForMedia = async (c: Context) => {
	const params = c.req.param();
	const result = streamQuerySchema.safeParse(params);
	if (!result.success) {
		throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: result.error.message });
	}
	const { imdbId, type, episode, season, jwt } = result.data;

	let user: User;
	try {
		user = await UserService.getUserByJwt(jwt);
	} catch (e) {
		throw new HTTPException(HttpStatusCode.UNAUTHORIZED, { message: 'Unauthorized' });
	}

	const torrents = await NcoreService.getTorrentsForImdbId({
		imdbId,
		type,
	});

	const torrentsWithMetadata: FullTorrent[] = torrents
		.map((torrent) => {
			const fileIndex = TorrentService.getMediaFileIndex(torrent, { season, episode });
			const resolution = TorrentService.getResolution(
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

	const orderedTorrents = StreamService.orderTorrents({ torrents: torrentsWithMetadata, user });

	const streams = orderedTorrents.map((torrent, i) =>
		StreamService.convertTorrentToStream({
			torrent,
			isRecommended: i === 0,
			jwt,
		}),
	);

	return c.json({ streams });
};

export const play = async (c: Context) => {
	const params = c.req.param();
	const result = playSchema.safeParse(params);
	if (!result.success) {
		throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: result.error.message });
	}
	const { ncoreId, infoHash, fileIdx } = result.data;

	let torrent = await TorrentStoreService.getTorrent(infoHash);

	if (!torrent) {
		const torrentUrl = await NcoreService.getTorrentUrlByNcoreId(ncoreId);
		const torrentFilePath = await TorrentService.downloadTorrentFile(torrentUrl);
		torrent = await TorrentStoreService.addTorrent(torrentFilePath);
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
};

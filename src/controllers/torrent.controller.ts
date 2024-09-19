import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { TorrentStoreService } from '@/services/torrent-store';
import { HttpStatusCode } from '@/types/http';

export const getTorrentStats = (c: Context) => {
	return c.json(TorrentStoreService.getStoreStats());
};

export const deleteTorrent = async (c: Context) => {
	const { infoHash } = c.req.param();
	if (!infoHash) {
		throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
			message: 'Bad Request',
			cause: 'Missing infohash in params',
		});
	}
	try {
		await TorrentStoreService.deleteTorrent(infoHash);
		return c.json({ success: true, error: undefined });
	} catch (error) {
		return c.json({ success: false, error });
	}
};

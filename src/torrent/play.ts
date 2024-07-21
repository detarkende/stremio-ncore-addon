import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import mime from 'mime';
import { store } from './store/index';
import { downloadTorrent } from './downloadTorrentFile';
import { parseRangeHeader } from '@/common/helpers/parseRangeHeader';

export const playTorrentFileRouter = new Hono();
playTorrentFileRouter.get('/:ncoreId/:infoHash/:fileIdx', async (c) => {
	const { ncoreId, infoHash, fileIdx } = c.req.param();
	let torrent = await store.getTorrent(infoHash);

	if (!torrent) {
		torrent = await downloadTorrent(ncoreId);
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

	const iterator = file[Symbol.asyncIterator]({ start, end });
	c.status(206);
	c.header('Content-Range', `bytes ${start}-${end}/${file.length}`);
	c.header('Accept-Ranges', 'bytes');
	c.header('Content-Length', `${end - start + 1}`);
	c.header('Content-Type', fileType);

	return stream(c, async (stream) => {
		stream.onAbort(() => {
			iterator.return?.();
			console.error('Stream aborted');
		});
		for await (const chunk of iterator) {
			await stream.write(chunk);
		}
	});
});

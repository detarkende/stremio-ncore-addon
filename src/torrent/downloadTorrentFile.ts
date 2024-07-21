import contentDisposition from 'content-disposition';
import ParseTorrent from 'parse-torrent';
import type WebTorrent from 'webtorrent';
import { store } from './store/index';
import { getDownloadUrlFromNcoreId } from '@/ncore/getDownloadUrlFromNcoreId';
import { writeFileWithCreateDir } from '@/common/helpers/writeFileWithCreateDir';
import { config } from '@/common/config/config';

const promises = new Map<string, Promise<WebTorrent.Torrent>>();

export const downloadTorrent = (ncoreId: string): Promise<WebTorrent.Torrent> => {
	const existingPromise = promises.get(ncoreId);
	if (existingPromise) return existingPromise;

	const promise = _downloadTorrent(ncoreId);
	promises.set(ncoreId, promise);
	setTimeout(() => {
		promises.delete(ncoreId);
	}, 5_000);
	return promise;
};

const _downloadTorrent = async (ncoreId: string) => {
	const torrentUrl = await getDownloadUrlFromNcoreId(ncoreId);
	const torrentReq = await fetch(torrentUrl);
	const torrentArrayBuffer = await torrentReq.arrayBuffer();
	const parsedTorrent = await ParseTorrent(new Uint8Array(torrentArrayBuffer));
	// torrent file name without the .torrent extension
	const torrentFileName = contentDisposition
		.parse(torrentReq.headers.get('content-disposition') ?? '')
		.parameters.filename?.replace(/\.torrent$/i, '');

	const torrentFilePath = `${config().torrents_dir}/${torrentFileName}-${
		parsedTorrent.infoHash
	}.torrent`;

	writeFileWithCreateDir(torrentFilePath, Buffer.from(torrentArrayBuffer));
	return store.addTorrent(torrentFilePath);
};

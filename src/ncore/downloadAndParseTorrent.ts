import type ParseTorrent from 'parse-torrent';
import parseTorrent from 'parse-torrent';
import { memoize } from '@/common/helpers/memoize';

const rawDownloadAndParseTorrent = async (torrentUrl: string): Promise<ParseTorrent.Instance> => {
	const torrentResponse = await fetch(torrentUrl);
	const buffer = await torrentResponse.arrayBuffer();
	const torrentData = await parseTorrent(new Uint8Array(buffer));
	return torrentData;
};

export const downloadAndParseTorrent = memoize({ fn: rawDownloadAndParseTorrent });

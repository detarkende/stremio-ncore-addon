import { globSync } from 'glob';
import { TorrentStore } from './webtorrentStore';
import { config } from '@/common/config/config';

export const store = new TorrentStore();

export const loadTorrents = async (): Promise<void> => {
	console.log('Looking for torrent files...');
	const savedTorrentFilePaths = globSync(`${config.TORRENTS_DIR}/*.torrent`);
	console.log(`Found ${savedTorrentFilePaths.length} torrent files.`);
	await Promise.allSettled(
		savedTorrentFilePaths.map((filePath) => {
			return store.addTorrent(filePath);
		}),
	);
	console.log('Torrent files loaded and verified.');
};

export type TorrentStoreStats = {
	hash: string;
	name: string;
	progress: string;
	size: string;
	downloaded: string;
};

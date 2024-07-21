import { findDeletableInfoHashes } from './findDeletableInfoHashes';
import { store } from '@/torrent/store/index';

export const deleteUnnecessaryTorrents = async () => {
	console.log('Running cron job for deleting torrents after hitnrun...');
	const deletableInfoHashes = await findDeletableInfoHashes();
	console.log(`Found ${deletableInfoHashes.length} deletable torrents.`);
	deletableInfoHashes.forEach(async (infoHash) => {
		const torrent = await store.getTorrent(infoHash);
		if (torrent) {
			store.deleteTorrent(infoHash);
			console.log(`Successfully deleted ${torrent.name} - ${torrent.infoHash}.`);
		}
	});
};

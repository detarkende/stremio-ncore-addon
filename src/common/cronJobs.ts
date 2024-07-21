import { schedule } from 'node-cron';
import { config } from './config/config';
import { deleteUnnecessaryTorrents } from '@/ncore/hitnrun/deleteUnnecessaryTorrents';

export const loadCronJobs = () => {
	if (config().ncore.delete_torrents_after_hitnrun.enabled) {
		schedule(config().ncore.delete_torrents_after_hitnrun.cron, deleteUnnecessaryTorrents);
	}
};

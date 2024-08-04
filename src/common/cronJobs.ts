import { schedule } from 'node-cron';
import { config } from './config/config';
import { deleteUnnecessaryTorrents } from '@/ncore/hitnrun/deleteUnnecessaryTorrents';

export const loadCronJobs = () => {
	if (config.DELETE_AFTER_HITNRUN) {
		schedule(config.DELETE_AFTER_HITNRUN_CRON, deleteUnnecessaryTorrents);
	}
};

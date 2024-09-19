import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { schedule } from 'node-cron';
import { applyRoutes } from './routes';
import { applyMiddlewares } from './middlewares';
import { TorrentStoreService } from '@/services/torrent-store';
import { config } from '@/services/config';

try {
	console.log('Config is successfully loaded and is valid.');
	await TorrentStoreService.loadExistingTorrents();
	if (config.DELETE_AFTER_HITNRUN_CRON) {
		console.log('Scheduling cron job for deleting torrents after hitnrun...');
		schedule(config.DELETE_AFTER_HITNRUN_CRON, TorrentStoreService.deleteUnnecessaryTorrents);
	}

	const app = new Hono();

	app.use('/assets/*', serveStatic({ root: '' }));

	applyMiddlewares(app);
	applyRoutes(app);

	serve({
		fetch: app.fetch,
		port: config.PORT,
	});

	console.log(`Server started on port ${config.PORT}!`);
} catch (e: unknown) {
	console.error(e);
	process.exit(1);
}

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { schedule } from 'node-cron';
import { applyRoutes } from './routes';
import { applyMiddlewares } from './middlewares';
import { config } from '@/config';

import { UserService } from '@/services/user';
import { ManifestService } from '@/services/manifest';
import { TorrentStoreService } from '@/services/torrent-store';
import { NcoreService } from '@/services/ncore';
import { TorrentService } from '@/services/torrent';
import { StreamService } from '@/services/stream';

import { ManifestController } from '@/controllers/manifest.controller';
import { LoginController } from '@/controllers/login.controller';
import { StreamController } from '@/controllers/stream.controller';
import { TorrentController } from '@/controllers/torrent.controller';

import { UserMiddleware } from '@/middlewares/user.middleware';

try {
	const userService = new UserService();
	const manifestService = new ManifestService();
	const torrentService = new TorrentService();
	const ncoreService = new NcoreService(torrentService);
	const torrentStoreService = new TorrentStoreService(ncoreService);
	const streamService = new StreamService(ncoreService);

	const manifestController = new ManifestController(manifestService, userService);
	const loginController = new LoginController(userService);
	const streamController = new StreamController(
		ncoreService,
		torrentService,
		streamService,
		userService,
		torrentStoreService,
	);
	const torrentController = new TorrentController(torrentStoreService);

	const userMiddleware = new UserMiddleware(userService);

	console.log('Config is successfully loaded and is valid.');

	await torrentStoreService.loadExistingTorrents();
	if (config.DELETE_AFTER_HITNRUN_CRON) {
		console.log('Scheduling cron job for deleting torrents after hitnrun...');
		schedule(config.DELETE_AFTER_HITNRUN_CRON, torrentStoreService.deleteUnnecessaryTorrents);
	}

	const app = new Hono();

	app.use('/assets/*', serveStatic({ root: '' }));

	applyMiddlewares(app);
	applyRoutes({
		app,
		userMiddleware,
		manifestController,
		loginController,
		streamController,
		torrentController,
	});

	serve({
		fetch: app.fetch,
		port: config.PORT,
	});

	console.log(`Server started on port ${config.PORT}!`);
} catch (e: unknown) {
	console.error(e);
	process.exit(1);
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { config } from '@/common/config/config';
import { loadTorrents } from '@/torrent/store/index';
import { authenticatedManifest, manifest } from '@/addon/manifest';
import { configureRouter } from '@/addon/configure/configure';
import { getTorrents } from '@/ncore/getTorrents';
import { convertTorrentsToStreams } from '@/addon/convertTorrentToStream';
import { adminRouter } from '@/addon/admin/admin';
import { jwtToUser } from '@/common/helpers/user';
import { loadCronJobs } from '@/common/cronJobs';
import { playTorrentFileRouter } from '@/torrent/play';

try {
	console.log('Config is successfully loaded and is valid.');
	await loadTorrents();
	loadCronJobs();

	const app = new Hono();

	app.use('*', cors());

	app.use('/assets/*', serveStatic({ root: '' }));

	app.route('/configure', configureRouter);

	app.get('/manifest.json', (c) => c.json(manifest(c.req)));

	app.use('/auth/:jwt/*', async (c, next) => {
		const { jwt } = c.req.param();
		const user = await jwtToUser(jwt);

		if (user && !!config.USERS.find((u) => u.username === user?.username)) {
			return next();
		}
		throw new HTTPException(401, { message: 'Unauthorized' });
		// return c.body('Unauthorized', 401);
	});

	app.get('/auth/:jwt/manifest.json', async (c) => {
		return c.json(await authenticatedManifest(c.req));
	});

	app.get('/auth/:jwt/stream/:type/:id', async (c) => {
		try {
			const { type } = c.req.param();
			let { id } = c.req.param();
			// The id is in the format of tt1234567.json
			id = id.replace(/\.json$/g, '');

			if ((type !== 'movie' && type !== 'series') || !id.startsWith('tt')) {
				return c.json({ streams: [] });
			}

			const torrents = await getTorrents(id);

			const streams = await convertTorrentsToStreams({
				torrents,
				jwt: c.req.param().jwt,
				origin: new URL(c.req.url).origin,
			});
			return c.json({
				streams,
			});
		} catch (e) {
			console.info(`The following error occurred on this url: ${c.req.url}`);
			console.error(e);
			return c.json({ streams: [] });
		}
	});
	app.route('/auth/:jwt/play', playTorrentFileRouter);

	app.use('/auth/:jwt/admin/*', async (c, next) => {
		const { jwt } = c.req.param();
		const user = await jwtToUser(jwt);
		const userFromConfig = config.USERS.find((u) => u.username === user?.username);
		if (userFromConfig && userFromConfig.role === 'admin') {
			return next();
		}
		return c.body('Unauthorized', 401);
	});
	app.route('/auth/:jwt/admin', adminRouter);

	serve({
		fetch: app.fetch,
		port: config.PORT,
	});

	console.log(`Server started on port ${config.PORT}!`);
} catch (e: unknown) {
	console.error(e);
	process.exit(1);
}

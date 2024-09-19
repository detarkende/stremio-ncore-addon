import type { Hono } from 'hono';
import { isAuthenticated, isAdmin } from './middlewares';
import * as ManifestController from '@/controllers/manifest.controller';
import * as LoginController from '@/controllers/login.controller';
import * as StreamController from '@/controllers/stream.controller';
import * as TorrentController from '@/controllers/torrent.controller';

export const applyRoutes = (app: Hono): void => {
	app.get('/manifest.json', (c) => ManifestController.getBaseManifest(c));

	app.get('/auth/:jwt/manifest.json', isAuthenticated(), (c) =>
		ManifestController.getAuthenticatedManifest(c),
	);

	app.post('/login', (c) => LoginController.handleLogin(c));

	app.get('/auth/:jwt/stream/:type/:imdbId', isAuthenticated(), (c) =>
		StreamController.getStreamsForMedia(c),
	);

	app.get('/auth/:jwt/stream/play/:ncoreId/:infoHash/:fileIdx', isAuthenticated(), (c) =>
		StreamController.play(c),
	);

	app.get('/auth/:jwt/torrents', isAdmin(), (c) => TorrentController.getTorrentStats(c));

	app.delete('/auth/:jwt/torrents/:infoHash', isAdmin(), (c) =>
		TorrentController.deleteTorrent(c),
	);
};

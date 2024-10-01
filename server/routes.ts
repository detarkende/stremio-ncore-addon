import type { Hono } from 'hono';
import type { ManifestController } from '@/controllers/manifest.controller';
import type { LoginController } from '@/controllers/login.controller';
import type { StreamController } from '@/controllers/stream.controller';
import type { TorrentController } from '@/controllers/torrent.controller';
import type { UserMiddleware } from '@/middlewares/user.middleware';

export const applyRoutes = ({
	app,
	userMiddleware: user,
	manifestController,
	loginController,
	streamController,
	torrentController,
}: {
	app: Hono;
	userMiddleware: UserMiddleware;
	manifestController: ManifestController;
	loginController: LoginController;
	streamController: StreamController;
	torrentController: TorrentController;
}): void => {
	app.get('/manifest.json', (c) => manifestController.getBaseManifest(c));

	app.get('/auth/:jwt/manifest.json', user.isAuthenticated(), (c) =>
		manifestController.getAuthenticatedManifest(c),
	);

	app.post('/login', (c) => loginController.handleLogin(c));

	app.get('/auth/:jwt/stream/:type/:imdbId', user.isAuthenticated(), (c) =>
		streamController.getStreamsForMedia(c),
	);

	app.get(
		'/auth/:jwt/stream/play/:sourceName/:sourceId/:infoHash/:fileIdx',
		user.isAuthenticated(),
		(c) => streamController.play(c),
	);

	app.get('/auth/:jwt/torrents', user.isAdmin(), (c) => torrentController.getTorrentStats(c));

	app.delete('/auth/:jwt/torrents/:infoHash', user.isAdmin(), (c) =>
		torrentController.deleteTorrent(c),
	);
};

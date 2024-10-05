import { Hono } from 'hono';
import type { ManifestController } from '@/controllers/manifest.controller';
import type { LoginController } from '@/controllers/login.controller';
import type { StreamController } from '@/controllers/stream.controller';
import type { TorrentController } from '@/controllers/torrent.controller';
import type { UserMiddleware } from '@/middlewares/user.middleware';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from './schemas/login.schema';

export const createRoutes = ({
  userMiddleware: user,
  manifestController,
  loginController,
  streamController,
  torrentController,
}: {
  userMiddleware: UserMiddleware;
  manifestController: ManifestController;
  loginController: LoginController;
  streamController: StreamController;
  torrentController: TorrentController;
}) => {
  const routes = new Hono()
    .get('/manifest.json', (c) => manifestController.getBaseManifest(c))

    .get('/auth/:jwt/manifest.json', user.isAuthenticated(), (c) =>
      manifestController.getAuthenticatedManifest(c),
    )

    .post('/login', zValidator('json', loginSchema), (c) => loginController.handleLogin(c))

    .get('/auth/:jwt/stream/:type/:imdbId', user.isAuthenticated(), (c) =>
      streamController.getStreamsForMedia(c),
    )

    .get(
      '/auth/:jwt/stream/play/:sourceName/:sourceId/:infoHash/:fileIdx',
      user.isAuthenticated(),
      (c) => streamController.play(c),
    )

    .get('/auth/:jwt/torrents', user.isAdmin(), (c) => torrentController.getTorrentStats(c))

    .delete('/auth/:jwt/torrents/:infoHash', user.isAdmin(), (c) =>
      torrentController.deleteTorrent(c),
    );

  return routes;
};

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { schedule } from 'node-cron';

import { config } from '@/config';

import { UserService } from '@/services/user';
import { ManifestService } from '@/services/manifest';
import { TorrentStoreService } from '@/services/torrent-store';
import { TorrentService } from '@/services/torrent';
import { StreamService } from '@/services/stream';

import { ManifestController } from '@/controllers/manifest.controller';
import { LoginController } from '@/controllers/login.controller';
import { StreamController } from '@/controllers/stream.controller';
import { TorrentController } from '@/controllers/torrent.controller';

import { UserMiddleware } from '@/middlewares';
import { NcoreService } from '@/services/torrent-source/ncore';
import { TorrentSourceManager } from '@/services/torrent-source';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '@/schemas/login.schema';
import { applyServeStatic } from '@/middlewares/serve-static';
import { UserController } from '@/controllers/user.controller';

const userService = new UserService();
const manifestService = new ManifestService();
const torrentService = new TorrentService();
const ncoreService = new NcoreService(torrentService);
const torrentSource = new TorrentSourceManager([ncoreService]);

const torrentStoreService = new TorrentStoreService(torrentSource);
const streamService = new StreamService();

const manifestController = new ManifestController(manifestService, userService);
const loginController = new LoginController(userService);
const userController = new UserController(userService);
const streamController = new StreamController(
  torrentSource,
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

const baseApp = new Hono();
baseApp.use(cors());

if (process.env.NODE_ENV === 'production') {
  applyServeStatic(baseApp);
  baseApp.use(logger());
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app = baseApp
  .get('/manifest.json', (c) => manifestController.getBaseManifest(c))
  .basePath('/api')
  .get('/auth/:jwt/manifest.json', userMiddleware.isAuthenticated(), (c) =>
    manifestController.getAuthenticatedManifest(c),
  )
  .get('/auth/:jwt/me', userMiddleware.isAuthenticated(), (c) => userController.getMe(c))
  .post('/login', zValidator('json', loginSchema), (c) => loginController.handleLogin(c))
  .get('/auth/:jwt/stream/:type/:imdbId', userMiddleware.isAuthenticated(), (c) =>
    streamController.getStreamsForMedia(c),
  )
  .get(
    '/auth/:jwt/stream/play/:sourceName/:sourceId/:infoHash/:fileIdx',
    userMiddleware.isAuthenticated(),
    (c) => streamController.play(c),
  )
  .get('/auth/:jwt/torrents', userMiddleware.isAdmin(), (c) => torrentController.getTorrentStats(c))
  .delete('/auth/:jwt/torrents/:infoHash', userMiddleware.isAdmin(), (c) =>
    torrentController.deleteTorrent(c),
  );

serve({
  fetch: baseApp.fetch,
  port: config.PORT,
});

console.log(`Server started on port ${config.PORT}!`);

export type ApiRoutes = typeof app;

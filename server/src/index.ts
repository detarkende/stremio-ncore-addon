import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { createServer } from 'node:https';

import { UserService } from '@/services/user';
import { ManifestService } from '@/services/manifest';
import { TorrentStoreService } from '@/services/torrent-store';
import { TorrentService } from '@/services/torrent';
import { StreamService } from '@/services/stream';

import { ManifestController } from '@/controllers/manifest.controller';
import { AuthController } from '@/controllers/auth.controller';
import { StreamController } from '@/controllers/stream.controller';
import { TorrentController } from '@/controllers/torrent.controller';

import { NcoreService } from '@/services/torrent-source/ncore';
import { TorrentSourceManager } from '@/services/torrent-source';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '@/schemas/login.schema';
import {
  applyServeStatic,
  createAdminMiddleware,
  createAuthMiddleware,
  createAdminOrSelfMiddleware,
  createDeviceTokenMiddleware,
} from '@/middlewares';
import { UserController } from '@/controllers/user.controller';
import { CinemeatService } from './services/cinemeta';
import { db } from '@/db';
import { HonoEnv } from './types/hono-env';
import { ConfigController } from './controllers/config.controller';
import { ConfigService } from './services/config';
import { env } from './env';
import { MissingConfigError } from './services/config/config.error';
import { SessionService } from './services/session';
import { DeviceTokenService } from './services/device-token';
import { DeviceTokenController } from './controllers/device-token.controller';
import {
  createDeviceTokenSchema,
  deleteDeviceTokenSchema,
} from './schemas/device-token.schema';
import { createConfigSchema, updateConfigSchema } from './schemas/config.schema';
import {
  createUserSchema,
  editUserSchema,
  updatePasswordSchema,
} from './schemas/user.schema';
import { HttpsService } from './services/https';
import { logger, requestLogger } from './logger';

const userService = new UserService(db);
const configService = new ConfigService(db, userService);
const sessionService = new SessionService(db);
const deviceTokenService = new DeviceTokenService(db);
const manifestService = new ManifestService(
  configService,
  userService,
  deviceTokenService,
);
const torrentService = new TorrentService();
const cinemetaService = new CinemeatService();
const torrentSource = new TorrentSourceManager([
  env.NCORE_URL && env.NCORE_USERNAME && env.NCORE_PASSWORD
    ? new NcoreService(
        torrentService,
        cinemetaService,
        env.NCORE_URL,
        env.NCORE_USERNAME,
        env.NCORE_PASSWORD,
      )
    : null,
]);

const isAuthenticated = createAuthMiddleware(sessionService);
const isAdmin = createAdminMiddleware(sessionService);
const isAdminOrSelf = createAdminOrSelfMiddleware(sessionService);
const isDeviceAuthenticated = createDeviceTokenMiddleware(userService);

const torrentStoreService = new TorrentStoreService(torrentSource);
await torrentStoreService.startServer();
const streamService = new StreamService(configService, userService);
configService.torrentStoreService = torrentStoreService;
const httpsService = new HttpsService();

const configController = new ConfigController(configService, torrentSource);
const manifestController = new ManifestController(manifestService);
const authController = new AuthController(userService, sessionService);
const deviceTokenController = new DeviceTokenController(deviceTokenService);
const userController = new UserController(userService);
const streamController = new StreamController(
  torrentSource,
  torrentService,
  streamService,
  userService,
  torrentStoreService,
);
const torrentController = new TorrentController(torrentStoreService);

torrentStoreService.loadExistingTorrents();

configService.scheduleDeleteAfterHitnrunCron();

const baseApp = new Hono();
baseApp.use(cors());

baseApp.get('/manifest.json', (c) => manifestController.getBaseManifest(c));

if (env.NODE_ENV === 'production') {
  applyServeStatic(baseApp);
}

const app = new Hono<HonoEnv>()
  .use(contextStorage())
  .use(requestLogger)
  .use(async (c, next) => {
    const resp = await next();
    if (c.error && c.error instanceof MissingConfigError) {
      return c.redirect('/config');
    }
    return resp;
  })
  .get('/auth/:deviceToken/manifest.json', isDeviceAuthenticated, (c) =>
    manifestController.getAuthenticatedManifest(c),
  )

  .get('/config/is-configured', (c) => configController.getIsConfigured(c))
  .get('/config/torrent-sources/issues', (c) =>
    configController.getTorrentSourceConfigIssues(c),
  )
  .get('/config', isAuthenticated, (c) => configController.getConfig(c))
  .post('/config', zValidator('json', createConfigSchema), (c) =>
    configController.createConfig(c),
  )
  .put('/config', isAdmin, zValidator('json', updateConfigSchema), (c) =>
    configController.updateConfig(c),
  )

  .get('/me', isAuthenticated, (c) => userController.getMe(c))
  .post('/login', zValidator('json', loginSchema), (c) => authController.login(c))
  .post('/logout', isAuthenticated, (c) => authController.logout(c))

  .get('/users', isAdmin, (c) => userController.getUsers(c))
  .post('/users', isAdmin, zValidator('json', createUserSchema), (c) =>
    userController.createUser(c),
  )
  .put('/users/:userId', isAdminOrSelf, zValidator('json', editUserSchema), (c) =>
    userController.updateUser(c),
  )
  .put(
    '/users/:userId/password',
    isAdminOrSelf,
    zValidator('json', updatePasswordSchema),
    (c) => userController.updatePassword(c),
  )
  .delete('/users/:userId', isAdmin, (c) => userController.deleteUser(c))

  .get('/device-tokens', isAuthenticated, (c) =>
    deviceTokenController.getDeviceTokensForUser(c),
  )
  .post(
    '/device-tokens',
    isAuthenticated,
    zValidator('json', createDeviceTokenSchema),
    (c) => deviceTokenController.createDeviceToken(c),
  )
  .delete(
    '/device-tokens',
    isAuthenticated,
    zValidator('json', deleteDeviceTokenSchema),
    (c) => deviceTokenController.deleteDeviceToken(c),
  )

  .get('/auth/:deviceToken/stream/:type/:imdbId', isDeviceAuthenticated, (c) =>
    streamController.getStreamsForMedia(c),
  )
  .get(
    '/auth/:deviceToken/stream/play/:sourceName/:sourceId/:infoHash/:fileIdx',
    isDeviceAuthenticated,
    (c) => streamController.play(c),
  )

  .get('/torrents', isAdmin, (c) => torrentController.getTorrentStats(c))
  .delete('/torrents/:infoHash', isAdmin, (c) => torrentController.deleteTorrent(c));

baseApp.route('/api', app);

// HTTP server
serve({
  fetch: baseApp.fetch,
  port: env.PORT,
});
logger.info(`HTTP server started on port ${env.PORT}!`);

// HTTPS server
serve({
  fetch: baseApp.fetch,
  port: env.HTTPS_PORT,
  createServer,
  serverOptions: httpsService.createServerOptions(),
});
logger.info(`HTTPS server started on port ${env.HTTPS_PORT}!`);

logger.debug(`Server running in ${env.NODE_ENV} environment`);

export type ApiRoutes = typeof app;

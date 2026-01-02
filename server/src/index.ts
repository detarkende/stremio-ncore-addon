import './init';
import { createServer } from 'node:https';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { env } from './env';
import { logger, requestLogger } from './logger';
import { authRoutes } from './app/auth';
import { torrentRoutes } from './app/torrent';
import { streamRoutes } from './app/stream';
import { userRoutes } from './app/user';
import { manifestRoutes } from './app/manifest';
import { configRoutes } from './app/config';
import { HttpsService } from './app/https';

export const app = new Hono()
  .use(contextStorage())
  .use(cors())
  .use(requestLogger)
  .route('/', manifestRoutes)
  .route('/', userRoutes)
  .route('/', authRoutes)
  .route('/', torrentRoutes)
  .route('/', streamRoutes)
  .route('/', configRoutes)
  .use('*', serveStatic({ root: './client/dist' }))
  .use('*', serveStatic({ root: './client/dist', path: 'index.html' }));

// HTTP server
serve({
  fetch: app.fetch,
  port: env.PORT,
});
logger.info(`HTTP server started on port ${env.PORT}!`);

// HTTPS server
serve({
  fetch: app.fetch,
  port: env.HTTPS_PORT,
  createServer,
  serverOptions: HttpsService.createServerOptions(),
});
logger.info(`HTTPS server started on port ${env.HTTPS_PORT}!`);

logger.debug(`Server running in ${env.NODE_ENV} environment`);

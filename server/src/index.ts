import './init';
import { createServer } from 'node:https';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';

import { authRoutes } from './app/auth';
import { configRoutes } from './app/config';
import { HttpsService } from './app/https';
import { manifestRoutes } from './app/manifest';
import { streamRoutes } from './app/stream';
import { torrentRoutes } from './app/torrent';
import { userRoutes } from './app/user';
import { env } from './env';
import { logger, requestLogger } from './logger';

const app = new Hono();
app.use(contextStorage()).use(cors()).use(requestLogger);

export const apiRoutes = app
  .route('/', manifestRoutes)
  .route('/', userRoutes)
  .route('/', authRoutes)
  .route('/', torrentRoutes)
  .route('/', streamRoutes)
  .route('/', configRoutes);

app
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

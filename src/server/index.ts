import './init';
import { createServer } from 'node:https';

import { serve } from '@hono/node-server';
import { viteMiddleware } from '@vite-fullstack/hono';
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
import { registerGracefulShutdown } from './shutdown';
import { HttpStatusCode } from './types/http';

const app = new Hono();
app
  .use(contextStorage())
  .use(cors())
  // Only log API requests to avoid cluttering the logs with frontend asset requests
  .use('/api', requestLogger);

export const apiRoutes = app
  .route('/', manifestRoutes)
  .route('/', userRoutes)
  .route('/', authRoutes)
  .route('/', torrentRoutes)
  .route('/', streamRoutes)
  .route('/', configRoutes);

app.use('*', viteMiddleware());

// Handle all other requests by returning the index.html file for frontend routing
app.get('*', async () => {
  return app.request('/');
});

// HTTP server
const httpServer = serve({
  fetch: app.fetch,
  port: env.PORT,
});
logger.info(`HTTP server started on port ${env.PORT}!`);

// HTTPS server
const httpsServer = serve({
  fetch: app.fetch,
  port: env.HTTPS_PORT,
  createServer,
  serverOptions: HttpsService.createServerOptions(),
});
logger.info(`HTTPS server started on port ${env.HTTPS_PORT}!`);

registerGracefulShutdown({
  http: httpServer,
  https: httpsServer,
});

logger.debug(`Server running in ${env.NODE_ENV} environment`);
if (env.NODE_ENV === 'development') {
  logger.info(
    `Server running at http://localhost:${env.PORT} and https://localhost:${env.HTTPS_PORT}`,
  );
}

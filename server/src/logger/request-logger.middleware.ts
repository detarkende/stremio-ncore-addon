import { HonoEnv } from '@/types/hono-env';
import { MiddlewareHandler } from 'hono';
import { logger } from './logger';

export const requestLogger: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const start = Date.now();
  const { method, path } = c.req;
  await next();
  const end = Date.now();
  const duration = end - start;
  const status = c.res.status;
  const user = c.get('user');

  logger.debug('API request', {
    method,
    path,
    userId: user?.id ?? 'Unknown',
    duration,
    status,
  });
};

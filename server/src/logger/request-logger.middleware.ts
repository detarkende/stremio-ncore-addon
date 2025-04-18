import type { MiddlewareHandler } from 'hono';
import { logger } from './logger';
import type { HonoEnv } from '@/types/hono-env';

export const requestLogger: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const start = Date.now();
  const { method, path } = c.req;
  await next();
  const end = Date.now();
  const duration = end - start;
  const status = c.res.status;
  const user = c.get('user');

  logger.info(
    {
      method,
      path,
      userId: user?.id ?? 'Unknown',
      duration,
      status,
    },
    'Request completed',
  );
};

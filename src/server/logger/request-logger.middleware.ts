import type { Session } from '@server/app/auth/auth.types';
import type { User } from '@server/types/user';
import type { MiddlewareHandler } from 'hono';

import { requestLogger } from './logger';

type HonoEnv = {
  Variables:
    | {
        user: User;
        session: Session;
      }
    | {
        user: null;
        session: null;
      };
};

export const requestLoggerMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const startTime = Date.now();
  await next();
  const duration = Date.now() - startTime;
  requestLogger.info('Request', {
    method: c.req.method,
    url: c.req.url,
    status: c.res.status,
    user: c.var.user?.id ?? null,
    duration,
  });
};

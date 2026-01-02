import type { MiddlewareHandler } from 'hono';
import type { Session } from 'src/db/schema/sessions';
import type { User } from 'src/types/user';
import { logger } from './logger';

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

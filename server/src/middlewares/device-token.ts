import { UserService } from '@/services/user';
import { HonoEnv } from '@/types/hono-env';
import { HttpStatusCode } from '@/types/http';
import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const createDeviceTokenMiddleware =
  (
    userService: UserService,
  ): MiddlewareHandler<HonoEnv, `${string}/:deviceToken${string}`> =>
  async (c, next) => {
    const deviceToken = c.req.param('deviceToken');
    if (!deviceToken) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
        message: 'Unauthorized',
      });
    }
    const user = await userService.getUserByDeviceTokenOrThrow(deviceToken);
    c.set('user', user);
    return next();
  };

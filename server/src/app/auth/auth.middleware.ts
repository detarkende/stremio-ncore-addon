import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import type { MiddlewareHandler } from 'hono';
import type { Session } from 'src/db/schema/sessions';
import type { User } from 'src/types/user';
import { HttpStatusCode } from 'src/types/http';
import { UserRole } from 'src/db/schema/users';
import { getUserByToken } from '../user/user.utils';
import { validateSessionToken } from './auth.utils';
import { SESSION_COOKIE_NAME } from './auth.constants';

type CookieAuthEnv = {
  Variables: {
    user: User;
    session: Session;
  };
};

export function useCookieAuth(
  allow: 'anyUser' | 'adminOnly' | 'adminOrSelfOnly' = 'anyUser',
): MiddlewareHandler<CookieAuthEnv, '/:userId'> {
  return createMiddleware<CookieAuthEnv, '/:userId'>(async (c, next) => {
    const cookie = getCookie(c, SESSION_COOKIE_NAME);
    if (!cookie) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const { session, user } = await validateSessionToken(cookie);

    if (!session || !user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const isAllowed =
      allow === 'anyUser' ||
      (allow === 'adminOnly' && user?.role === UserRole.ADMIN) ||
      (allow === 'adminOrSelfOnly' &&
        (user.role === UserRole.ADMIN || user.id === Number(c.req.param('userId'))));

    if (!isAllowed) {
      throw new HTTPException(HttpStatusCode.FORBIDDEN);
    }

    c.set('user', user);
    c.set('session', session);
    return next();
  });
}

type UrlTokenAuthEnv = {
  Variables: {
    user: User;
  };
};

export const useUrlTokenAuth = ({ adminOnly } = { adminOnly: false }) =>
  createMiddleware<UrlTokenAuthEnv, '/:token'>(async (c, next) => {
    const { token } = c.req.param();
    const user = await getUserByToken(token);
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    if (adminOnly && user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.FORBIDDEN);
    }
    c.set('user', user);
    return next();
  });

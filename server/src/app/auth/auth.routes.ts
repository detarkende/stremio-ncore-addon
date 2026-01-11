import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { deleteCookie, setCookie } from 'hono/cookie';
import { loginSchema } from 'src/schemas/login.schema';
import { HttpStatusCode } from 'src/types/http';
import { HTTPException } from 'hono/http-exception';
import { getUserByCredentials } from '../user/user.utils';
import { useCookieAuth } from './auth.middleware';
import { createSession, generateSessionToken, invalidateSession } from './auth.utils';
import { SESSION_COOKIE_NAME } from './auth.constants';

export const authRoutes = new Hono()
  .basePath('/api')
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const credentials = c.req.valid('json');
    const user = await getUserByCredentials(credentials);
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
        message: 'Incorrect credentials',
      });
    }
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
      expires: session.expiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'Strict',
    });
    return c.body(null);
  })
  .post('/logout', useCookieAuth(), async (c) => {
    const { session } = c.var;
    await invalidateSession(session.id);
    deleteCookie(c, SESSION_COOKIE_NAME);
    return c.newResponse(null, 204);
  });

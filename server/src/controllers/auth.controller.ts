import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { deleteCookie, setCookie } from 'hono/cookie';
import type { LoginCredentials } from '@/schemas/login.schema';
import type { UserService } from '@/services/user';
import type { HonoEnv } from '@/types/hono-env';
import type { SessionService } from '@/services/session';
import { HttpStatusCode } from '@/types/http';
import { SESSION_COOKIE_NAME } from '@/constants/auth';

export class AuthController {
  constructor(
    private userService: UserService,
    private sessionService: SessionService,
  ) {}

  public async login(c: Context<HonoEnv, '/login', { out: { json: LoginCredentials } }>) {
    const credentials = c.req.valid('json');
    const user = await this.userService.getUserByCredentials(credentials);
    if (!user) {
      return c.json({ success: false, message: 'Incorrect credentials' }, 401);
    }

    const sessionToken = this.sessionService.generateSessionToken();
    const session = await this.sessionService.createSession(sessionToken, user.id);
    setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
      expires: session.expiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'Strict',
    });
    return c.json({ success: true, message: undefined });
  }

  public async logout(c: Context<HonoEnv>) {
    const { user, session } = c.var;
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    await this.sessionService.invalidateSession(session.id);
    deleteCookie(c, SESSION_COOKIE_NAME);
    return c.newResponse(null, 204);
  }
}

import type { Context } from 'hono';
import { LoginCredentials } from '@/schemas/login.schema';
import type { UserService } from '@/services/user';
import { HonoEnv } from '@/types/hono-env';
import { SessionService } from '@/services/session';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from '@/types/http';
import { deleteCookie, setCookie } from 'hono/cookie';
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
      secure: true,
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

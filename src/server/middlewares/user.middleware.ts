import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { UserRole } from '@/schemas/user.schema';
import type { UserService } from '@/services/user';
import { HttpStatusCode } from '@/types/http';

export class UserMiddleware {
  constructor(private userService: UserService) {}

  public isAuthenticated(jwtParam = 'jwt'): MiddlewareHandler {
    return async (c, next) => {
      const jwt = (c.req.param() as Record<string, string>)[jwtParam];
      if (!jwt) {
        console.error(`JWT param ("${jwtParam}") not found in URL ${c.req.url}`);
        throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      try {
        await this.userService.getUserByJwt(jwt);
      } catch {
        throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
          message: 'Unauthorized',
        });
      }
      return next();
    };
  }

  public isAdmin(jwtParam = 'jwt'): MiddlewareHandler {
    return async (c, next) => {
      const jwt = (c.req.param() as Record<string, string>)[jwtParam];
      if (!jwt) {
        console.error(`JWT param ("${jwtParam}") not found in URL ${c.req.url}`);
        throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      try {
        const user = await this.userService.getUserByJwt(jwt);
        if (user.role !== UserRole.ADMIN) {
          throw new HTTPException(HttpStatusCode.FORBIDDEN, {
            message: 'Forbidden. You are not an admin.',
          });
        }
      } catch {
        throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
          message: 'Unauthorized',
        });
      }
      return next();
    };
  }
}

import { HTTPException } from 'hono/http-exception';
import type { MiddlewareHandler } from 'hono';
import * as UserService from '@/services/user';
import { UserRole } from '@/schemas/user.schema';
import { HttpStatusCode } from '@/types/http';

export function isAdmin(jwtParam = 'jwt'): MiddlewareHandler {
	return async (c, next) => {
		const jwt = (c.req.param() as Record<string, string>)[jwtParam];
		if (!jwt) {
			console.error(`JWT param ("${jwtParam}") not found in URL ${c.req.url}`);
			throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR);
		}
		try {
			const user = await UserService.getUserByJwt(jwt);
			if (user.role !== UserRole.ADMIN) {
				throw new HTTPException(HttpStatusCode.FORBIDDEN, {
					message: 'Forbidden. You are not an admin.',
				});
			}
		} catch (e) {
			throw new HTTPException(HttpStatusCode.UNAUTHORIZED, { message: 'Unauthorized' });
		}
		return next();
	};
}

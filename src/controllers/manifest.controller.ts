import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { User } from '@/schemas/user.schema';
import * as ManifestService from '@/services/manifest';
import * as UserService from '@/services/user';
import { HttpStatusCode } from '@/types/http';

export const getBaseManifest = async (c: Context) => {
	return c.json(ManifestService.getBaseManifest());
};

export const getAuthenticatedManifest = async (c: Context) => {
	const jwtToken = c.req.param('jwt');
	if (!jwtToken) {
		throw new HTTPException(HttpStatusCode.UNAUTHORIZED, { message: 'Unauthorized' });
	}
	let user: User;
	try {
		user = await UserService.getUserByJwt(jwtToken);
	} catch (e) {
		throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
			message: `Error during JWT authentication: ${e}`,
		});
	}
	return c.json(ManifestService.getAuthenticatedManifest(user));
};

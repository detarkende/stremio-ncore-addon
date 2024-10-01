import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { User } from '@/schemas/user.schema';
import type { ManifestService } from '@/services/manifest';
import type { UserService } from '@/services/user';
import { HttpStatusCode } from '@/types/http';

export class ManifestController {
	constructor(
		private manifestService: ManifestService,
		private userService: UserService,
	) {}
	public async getBaseManifest(c: Context) {
		return c.json(this.manifestService.getBaseManifest());
	}

	public async getAuthenticatedManifest(c: Context) {
		const jwtToken = c.req.param('jwt');
		if (!jwtToken) {
			throw new HTTPException(HttpStatusCode.UNAUTHORIZED, { message: 'Unauthorized' });
		}
		let user: User;
		try {
			user = await this.userService.getUserByJwt(jwtToken);
		} catch (e) {
			throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
				message: `Error during JWT authentication: ${e}`,
			});
		}
		return c.json(this.manifestService.getAuthenticatedManifest(user));
	}
}

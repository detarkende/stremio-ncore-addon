import type { Context } from 'hono';
import { loginSchema } from '@/schemas/login.schema';
import type { UserService } from '@/services/user';

export class LoginController {
	constructor(private userService: UserService) {}
	public async handleLogin(c: Context) {
		const body = await c.req.parseBody();
		const parsedBody = loginSchema.safeParse(body);
		if (!parsedBody.success) {
			return c.json({ success: false, message: parsedBody.error.message }, 400);
		}
		const user = await this.userService.getUserByCredentials(parsedBody.data);
		if (!user) {
			return c.json({ success: false, message: 'Incorrect credentials' }, 401);
		}

		const jwt = await this.userService.getJwtByUser(user);
		return c.json({ success: true, jwt });
	}
}

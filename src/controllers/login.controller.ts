import type { Context } from 'hono';
import { loginSchema } from '@/schemas/login.schema';
import * as UserService from '@/services/user';
import type { InferJson } from '@/types/infer-json';

export const handleLogin = async (c: Context) => {
	const body = await c.req.parseBody();
	const parsedBody = loginSchema.safeParse(body);
	if (!parsedBody.success) {
		return c.json({ success: false, message: parsedBody.error.message }, 400);
	}
	const user = await UserService.getUserByCredentials(parsedBody.data);
	if (!user) {
		return c.json({ success: false, message: 'Incorrect credentials' }, 401);
	}

	const jwt = await UserService.getJwtByUser(user);
	return c.json({ success: true, jwt });
};

export type LoginResponse = InferJson<typeof handleLogin>;

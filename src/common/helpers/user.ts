import { sign, verify } from 'hono/jwt';
import type { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { config } from '../config/config';
import { type userSchema } from '../config/config.schema';

type User = z.infer<typeof userSchema>;

export const jwtToUser = async (jwt: string): Promise<User | undefined> => {
	try {
		const userData = await verify(jwt, config().secret);
		if (typeof userData === 'string') {
			return config().users.find((u) => u.username === userData);
		}
	} catch (e) {
		throw new HTTPException(401, { message: 'Unauthorized' });
	}
};

export const userToJwt = async (user: User): Promise<string> => {
	const { username } = user;
	return await sign(username, config().secret);
};

export const getUserByCredentials = async ({
	username,
	password,
}: Pick<User, 'username' | 'password'>): Promise<User | undefined> => {
	const { users } = config();
	const user = users.find((u) => u.username === username && u.password === password);
	return user;
};

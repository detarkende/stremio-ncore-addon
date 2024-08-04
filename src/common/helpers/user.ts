import { sign, verify } from 'hono/jwt';
import type { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { config } from '../config/config';
import { type userSchema } from '../config/config.schema';

type User = z.infer<typeof userSchema>;

export const jwtToUser = async (jwt: string): Promise<User | undefined> => {
	try {
		const userData = await verify(jwt, config.APP_SECRET);
		if (typeof userData === 'string') {
			return config.USERS.find((u) => u.username === userData);
		}
	} catch (e) {
		throw new HTTPException(401, { message: 'Unauthorized' });
	}
};

export const userToJwt = async (user: User): Promise<string> => {
	const { username } = user;
	return await sign(username, config.APP_SECRET);
};

export const getUserByCredentials = async ({
	username,
	password,
}: Pick<User, 'username' | 'password'>): Promise<User | undefined> => {
	const { USERS } = config;
	const user = USERS.find((u) => u.username === username && u.password === password);
	return user;
};

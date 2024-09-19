import { sign, verify } from 'hono/jwt';
import { config } from '../config';
import type { User } from '@/schemas/user.schema';
import type { LoginCredentials } from '@/schemas/login.schema';

/**
 * @throws {Error} If the user is not found, the jwt verification fails, or the user data is in an invalid shape.
 */
export const getUserByJwt = async (jwt: string): Promise<User> => {
	const userData = await verify(jwt, config.APP_SECRET);
	if ('username' in userData) {
		const user = config.USERS.find((u) => u.username === userData.username);
		if (!user) {
			throw new Error('User not found.');
		}
		return user;
	} else {
		throw new Error('Invalid shape of user data.');
	}
};

/**
 * @throws {Error} If the user is not found.
 */
export const getUserByCredentials = async (credentials: LoginCredentials): Promise<User | null> => {
	const user = config.USERS.find(
		(u) => u.username === credentials.username && u.password === credentials.password,
	);
	return user ?? null;
};

export const getJwtByUser = async (user: User): Promise<string> => {
	const { username } = user;
	return await sign({ username }, config.APP_SECRET);
};

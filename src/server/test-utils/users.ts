import { createSession, generateSessionToken } from '@server/app/auth/auth.utils';
import { db } from '@server/db';
import { Language, Resolution, UserRole, usersTable } from '@server/db/schema/users';
import { User } from '@server/types/user';
import { eq, type InferInsertModel } from 'drizzle-orm';

import { getRandomInt, getRandomString } from './random';

function createDefaultUserData(): InferInsertModel<typeof usersTable> {
  return {
    username: `testuser-${getRandomInt()}`,
    passwordHash: getRandomString(32),
    role: UserRole.USER,
    preferred_language: Language.EN,
    preferred_resolutions: [Resolution.R720P],
    token: getRandomString(32),
    token_rotated_at: new Date(Date.now()),
  };
}

export async function createTestUser(
  data: Partial<InferInsertModel<typeof usersTable>> = {},
) {
  const defaultData = createDefaultUserData();
  const userData = { ...defaultData, ...data };
  const [user] = await db.insert(usersTable).values(userData).returning();
  return user;
}

export async function createTestUserWithSession(
  data: Partial<InferInsertModel<typeof usersTable>> = {},
) {
  const user = await createTestUser(data);
  const token = generateSessionToken();
  const session = await createSession(token, user.id);
  return { user, session, token };
}

export async function getTestUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ? new User(user) : null;
}

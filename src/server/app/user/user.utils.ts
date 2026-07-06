import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { db } from '@server/db';
import { UserRole, usersTable } from '@server/db/schema/users';
import type { LoginCredentials } from '@server/schemas/login.schema';
import type { CreateUserRequest, UpdateUserRequest } from '@server/schemas/user.schema';
import { User } from '@server/types/user';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { PASSWORD_SALT_ROUNDS } from './user.constants';

export async function getUserByToken(token: string): Promise<User | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.token, token));
  if (!user) {
    return null;
  }
  return new User(user);
}

export async function getUserByCredentials({
  username,
  password,
}: LoginCredentials): Promise<User | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));
  if (!user) {
    return null;
  }
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }
  return new User(user);
}

export function generateRandomToken() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, PASSWORD_SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function updateUserRequestToUpdateStatement(user: UpdateUserRequest) {
  const updateStatement = {
    username: user.username,
    preferred_language: user.preferredLanguage,
    preferred_resolutions: user.preferredResolutions,
    token_rotated_at: new Date(),
  } satisfies Omit<typeof usersTable.$inferInsert, 'passwordHash' | 'role' | 'token'>;
  return updateStatement;
}

export function createUserRequestToInsertStatement({
  user,
  isAdmin,
}: {
  user: CreateUserRequest;
  isAdmin: boolean;
}): typeof usersTable.$inferInsert {
  return {
    ...updateUserRequestToUpdateStatement(user),
    passwordHash: hashPassword(user.password),
    role: isAdmin ? UserRole.ADMIN : UserRole.USER,
    token: generateRandomToken(),
  };
}

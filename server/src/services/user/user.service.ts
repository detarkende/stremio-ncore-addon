import type { LoginCredentials } from '@/schemas/login.schema';
import { Database } from '@/db';
import { UserRole, usersTable } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { PASSWORD_SALT_ROUNDS } from './constants';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from '@/types/http';
import { deviceTokensTable } from '@/db/schema/device-tokens';
import { Transaction } from '@/db/client';
import { CreateUserRequest, EditUserRequest, User } from '@/types/user';

export class UserService {
  constructor(private db: Database) {}

  public async getUserByDeviceToken(deviceToken: string): Promise<User> {
    const [{ users: user }] = await this.db
      .select()
      .from(deviceTokensTable)
      .leftJoin(usersTable, eq(deviceTokensTable.userId, usersTable.id))
      .where(eq(deviceTokensTable.token, deviceToken));
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
        message: `User not found for device token "${deviceToken}"`,
      });
    }
    return new User(user);
  }

  public async getUserByDeviceTokenOrThrow(deviceToken: string): Promise<User> {
    const user = await this.getUserByDeviceToken(deviceToken);
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED, {
        message: 'Unauthorized',
      });
    }
    return user;
  }

  public async getUserByCredentials(credentials: LoginCredentials): Promise<User | null> {
    const [userFromDb] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, credentials.username));
    const isPasswordCorrect = await bcrypt.compare(
      credentials.password,
      userFromDb?.passwordHash ?? '',
    );

    if (!userFromDb || !isPasswordCorrect) {
      return null;
    }
    return new User(userFromDb);
  }

  public async createUser(
    userDetails: CreateUserRequest,
    tx: Transaction | Database = this.db,
    role = UserRole.USER,
  ): Promise<User> {
    const { username, password, preferredLanguage, preferredResolutions } = userDetails;
    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const [userFromDb] = await tx
      .insert(usersTable)
      .values({
        role,
        username,
        passwordHash,
        preferred_language: preferredLanguage,
        preferred_resolutions: preferredResolutions,
      })
      .returning();
    return new User(userFromDb);
  }

  public async updateUser(userId: number, userDetails: EditUserRequest): Promise<User> {
    const { username, preferredLanguage, preferredResolutions } = userDetails;
    const [updatedUser] = await this.db
      .update(usersTable)
      .set({
        username,
        preferred_language: preferredLanguage,
        preferred_resolutions: preferredResolutions,
      })
      .where(eq(usersTable.id, userId))
      .returning();
    return new User(updatedUser);
  }

  public async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    const [updatedUser] = await this.db
      .update(usersTable)
      .set({
        passwordHash,
      })
      .where(eq(usersTable.id, userId))
      .returning();
    return new User(updatedUser);
  }

  public async getAllUsers() {
    const usersResult = await this.db.select().from(usersTable);
    return usersResult;
  }

  public async deleteUser(userId: number) {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) {
      throw new HTTPException(HttpStatusCode.NOT_FOUND, {
        message: `User with ID ${userId} not found`,
      });
    }
    if (user.role === UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: 'Cannot delete admin user',
      });
    }
    await this.db.delete(usersTable).where(eq(usersTable.id, userId));
  }
}

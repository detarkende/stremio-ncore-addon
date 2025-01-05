import { UserRole } from '@/db/schema/users';
import { UserService } from '@/services/user';
import { HonoEnv } from '@/types/hono-env';
import { HttpStatusCode } from '@/types/http';
import {
  CreateUserRequest,
  EditUserRequest,
  UpdatePasswordRequest,
  User,
} from '@/types/user';
import { isInteger } from '@/utils/numbers';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class UserController {
  constructor(private userService: UserService) {}

  public async getMe(c: Context<HonoEnv>) {
    const { user } = c.var;
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    return c.json({ ...user });
  }

  public async getUsers(c: Context<HonoEnv>) {
    const { user } = c.var;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const users = await this.userService.getAllUsers();
    return c.json(users.map((user) => new User(user)));
  }

  public async createUser(
    c: Context<HonoEnv, '/users', { out: { json: CreateUserRequest } }>,
  ) {
    const user = c.req.valid('json');
    const createdUser = await this.userService.createUser(user);
    return c.json(createdUser);
  }

  public async updateUser(
    c: Context<HonoEnv, '/users/:userId', { out: { json: EditUserRequest } }>,
  ) {
    const userDetails = c.req.valid('json');
    const userId = c.req.param('userId');
    if (!isInteger(userId)) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'Invalid user ID' });
    }
    const updatedUser = await this.userService.updateUser(Number(userId), userDetails);
    return c.json(updatedUser);
  }

  public async updatePassword(
    c: Context<
      HonoEnv,
      '/users/:userId/password',
      { out: { json: UpdatePasswordRequest } }
    >,
  ) {
    const { user } = c.var;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const userId = c.req.param('userId');
    if (!isInteger(userId)) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'Invalid user ID' });
    }
    const { password } = c.req.valid('json');
    await this.userService.updateUserPassword(Number(userId), password);
    return c.json({ message: 'Password updated successfully' });
  }

  public async deleteUser(c: Context<HonoEnv, `/users/:userId`>) {
    const { user } = c.var;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const userId = c.req.param('userId');
    if (!isInteger(userId)) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'Invalid user ID' });
    }
    await this.userService.deleteUser(Number(userId));
    return c.json({ message: 'User deleted successfully' });
  }
}

import type { Context } from 'hono';
import { LoginCredentials } from '@/schemas/login.schema';
import type { UserService } from '@/services/user';

export class LoginController {
  constructor(private userService: UserService) {}
  public async handleLogin(
    c: Context<NonNullable<unknown>, '/login', { out: { json: LoginCredentials } }>,
  ) {
    const credentials = c.req.valid('json');
    const user = await this.userService.getUserByCredentials(credentials);
    if (!user) {
      return c.json({ success: false, message: 'Incorrect credentials' }, 401);
    }

    const jwt = await this.userService.getJwtByUser(user);
    return c.json({ success: true, jwt });
  }
}

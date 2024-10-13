import { User } from '@/schemas/user.schema';
import { UserService } from '@/services/user';
import { Context } from 'hono';

export class UserController {
  constructor(private userService: UserService) {}

  async getMe(c: Context) {
    const jwt = c.req.param('jwt');
    const user = await this.userService.getUserByJwt(jwt);
    return c.json({
      username: user.username,
      role: user.role,
      preferred_lang: user.preferred_lang,
      preferred_resolutions: user.preferred_resolutions,
    } satisfies Omit<User, 'password'>);
  }
}

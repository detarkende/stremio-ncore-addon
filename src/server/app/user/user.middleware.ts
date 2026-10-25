import { db } from '@server/db';
import { usersTable } from '@server/db/schema';
import { HttpStatusCode } from '@server/types/http';
import { User } from '@server/types/user';
import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

type UserMiddlewareEnv = {
  Variables: {
    userFromUrl: User;
  };
};
export const userFromUrlExists = () =>
  createMiddleware<UserMiddlewareEnv, '/:userId'>(async (c, next) => {
    const { userId } = c.req.param();
    const userFromUrl = db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, Number(userId)))
      .limit(1)
      .get();
    if (!userFromUrl) {
      return c.json({ message: 'User not found' }, HttpStatusCode.NOT_FOUND);
    }
    c.set('userFromUrl', new User(userFromUrl));
    return next();
  });

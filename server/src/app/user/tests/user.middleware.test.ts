import { Hono } from 'hono';
import { createTestUser } from 'src/test-utils/users';

import { userFromUrlExists } from '../user.middleware';

describe('User middlewares', () => {
  describe('userFromUrlExists', () => {
    it('should return 404 if user does not exist', async () => {
      await createTestUser();
      const app = new Hono().get('/user/:userId', userFromUrlExists(), (c) =>
        c.json({ ok: true }),
      );

      const response = await app.request('/user/nonexistent-user');

      expect(response.status).toBe(404);
    });

    it('should allow the request to proceed if user exists', async () => {
      const mockUser = await createTestUser();
      const app = new Hono().get('/user/:userId', userFromUrlExists(), (c) =>
        c.json({ ok: true }),
      );

      const response = await app.request(`/user/${mockUser.id}`);

      expect(response.status).toBe(200);
    });
  });
});

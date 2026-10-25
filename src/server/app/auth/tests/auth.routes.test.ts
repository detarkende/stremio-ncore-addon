import { UserRole } from '@server/app/user/user.types';
import { hashPassword } from '@server/app/user/user.utils';
import type { LoginCredentials } from '@server/schemas/login.schema';
import { createTestUser, createTestUserWithSession } from '@server/test-utils/users';
import { testClient } from 'hono/testing';

import { SESSION_COOKIE_NAME } from '../auth.constants';
import { authRoutes } from '../auth.routes';

describe('Auth routes', () => {
  const client = testClient(authRoutes);
  describe('POST /api/login', () => {
    it.each([
      { role: UserRole.ADMIN, roleName: 'admin' },
      { role: UserRole.USER, roleName: 'non-admin' },
    ])('should login a $roleName user with correct credentials', async ({ role }) => {
      const testPassword = 'password123';
      const passwordHash = hashPassword(testPassword);
      const testUser = await createTestUser({ role, passwordHash });

      const response = await client.api.login.$post({
        json: {
          username: testUser.username,
          password: testPassword,
        },
      });

      expect(response.status).toBe(200);
      const cookies = response.headers.get('Set-Cookie');
      expect(cookies).toBeDefined();
      expect(cookies).toMatch(
        /session=.*; Path=\/; Expires=.*; HttpOnly; SameSite=Strict/,
      );
    });
    it('should return 401 for incorrect credentials', async () => {
      const response = await client.api.login.$post({
        json: {
          username: 'nonexistentuser',
          password: 'wrongpassword',
        },
      });

      expect(response.status).toBe(401);
      const cookies = response.headers.get('Set-Cookie');
      expect(cookies).toBeNull();
    });
    it('should return 400 for invalid request body', async () => {
      const response = await client.api.login.$post({
        json: {
          user: 'invalid',
          pass: 'data',
        } as unknown as LoginCredentials,
      });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/logout', () => {
    it('should logout an authenticated user', async () => {
      const { token } = await createTestUserWithSession();

      const response = await client.api.logout.$post(
        {},
        {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        },
      );
      expect(response.status).toBe(204);
      const cookies = response.headers.get('Set-Cookie');
      expect(cookies).toBeDefined();
      expect(cookies).toMatch(`${SESSION_COOKIE_NAME}=; Max-Age=0; Path=`);
    });
    it('todo should return 401 for unauthenticated requests', async () => {
      const response = await client.api.logout.$post({}, { headers: { Cookie: '' } });
      expect(response.status).toBe(401);
    });
  });
});

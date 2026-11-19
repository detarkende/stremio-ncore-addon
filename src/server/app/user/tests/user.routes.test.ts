import { SESSION_COOKIE_NAME } from '@server/app/auth/auth.constants';
import { Language, Resolution, UserRole } from '@server/app/user/user.types';
import type { CreateUserRequest } from '@server/schemas/user.schema';
import { getRandomString } from '@server/test-utils/random';
import {
  createTestUser,
  createTestUserWithSession,
  getTestUserById,
} from '@server/test-utils/users';
import { testClient } from 'hono/testing';

import { userRoutes } from '../user.routes';
import { getUserByCredentials, hashPassword } from '../user.utils';

vi.mock('@server/env', () => ({
  env: {
    NODE_ENV: 'test',
    ADDON_DIR: '/addon-dir',
    NCORE_USERNAME: 'username',
    NCORE_PASSWORD: 'password',
  },
}));

describe('User routes', () => {
  const client = testClient(userRoutes);

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const { user: adminUser, token: adminToken } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });
      const users = await Promise.all(
        Array.from({ length: 3 }).map(() => createTestUser()),
      );

      const response = await client.api.users.$get(
        {},
        {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
        },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.length).toBe(4); // 3 created + 1 admin
      const usernames = body.map((u) => u.username);
      for (const user of users) {
        expect(usernames).toContain(user.username);
      }
      expect(usernames).toContain(adminUser.username);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await client.api.users.$get({}, { headers: { Cookie: '' } });

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const { token: userToken } = await createTestUserWithSession({
        role: UserRole.USER,
      });

      const response = await client.api.users.$get(
        {},
        {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${userToken}` },
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return the authenticated user', async () => {
      const { user, token } = await createTestUserWithSession({
        role: UserRole.USER,
      });
      const response = await client.api.users.me.$get(
        {},
        {
          headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        },
      );
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.username).toBe(user.username);
      expect(body.id).toBe(user.id);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await client.api.users.me.$get({}, { headers: { Cookie: '' } });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    const exampleUserData: CreateUserRequest = {
      username: 'example-user',
      password: 'example-password',
      preferredLanguage: Language.EN,
      preferredResolutions: [Resolution.R720P, Resolution.R1080P],
    };

    it('should respond with 401 for unauthenticated requests', async () => {
      const response = await client.api.users.$post({ json: exampleUserData });

      expect(response.status).toBe(401);
    });

    it('should respond with 403 for non-admin users', async () => {
      const { token } = await createTestUserWithSession({
        role: UserRole.USER,
      });

      const response = await client.api.users.$post(
        { json: exampleUserData },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );

      expect(response.status).toBe(403);
    });

    it('should create a new user when requested by an admin', async () => {
      const { token: adminToken } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });

      const response = await client.api.users.$post(
        {
          json: {
            username: 'example-user',
            password: 'example-password',
            preferredLanguage: Language.EN,
            preferredResolutions: [Resolution.R720P, Resolution.R1080P],
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` } },
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('username', 'example-user');
      expect(body).toHaveProperty('role', UserRole.USER);
      expect(body).toHaveProperty('preferredLanguage', Language.EN);
      expect(body).toHaveProperty('preferredResolutions', [
        Resolution.R720P,
        Resolution.R1080P,
      ]);
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('should not allow creating a user with an existing username', async () => {
      const { token: adminToken } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });
      const existingUser = await createTestUser({ username: 'existing-user' });

      const response = await client.api.users.$post(
        {
          json: {
            username: existingUser.username,
            password: 'example-password',
            preferredLanguage: Language.EN,
            preferredResolutions: [Resolution.R720P, Resolution.R1080P],
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` } },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('message', 'Username is already taken.');
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should update user details when requested by admin', async () => {
      const { token: adminToken } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });
      const { user: normalUser } = await createTestUserWithSession({
        role: UserRole.USER,
        preferred_language: Language.EN,
        preferred_resolutions: [Resolution.R720P],
      });
      const UPDATED_USERNAME = `updated-username-${getRandomString(10)}`;

      const response = await client.api.users[':userId'].$put(
        {
          param: { userId: `${normalUser.id}` },
          json: {
            preferredLanguage: Language.HU,
            preferredResolutions: [Resolution.R2160P],
            username: UPDATED_USERNAME,
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` } },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('id', normalUser.id);
      expect(body).toHaveProperty('username', UPDATED_USERNAME);
      expect(body).toHaveProperty('preferredLanguage', Language.HU);
      expect(body).toHaveProperty('preferredResolutions', [Resolution.R2160P]);
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('should update user details when requested by the user', async () => {
      const { user: normalUser, token: normalUserToken } =
        await createTestUserWithSession({
          role: UserRole.USER,
          preferred_language: Language.EN,
          preferred_resolutions: [Resolution.R720P],
        });

      const UPDATED_USERNAME = `updated-username-${getRandomString(10)}`;

      const response = await client.api.users[':userId'].$put(
        {
          param: { userId: `${normalUser.id}` },
          json: {
            preferredLanguage: Language.HU,
            preferredResolutions: [Resolution.R2160P],
            username: UPDATED_USERNAME,
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${normalUserToken}` } },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('id', normalUser.id);
      expect(body).toHaveProperty('username', UPDATED_USERNAME);
      expect(body).toHaveProperty('preferredLanguage', Language.HU);
      expect(body).toHaveProperty('preferredResolutions', [Resolution.R2160P]);
      expect(body).not.toHaveProperty('passwordHash');
    });

    it('should not update user details when requested by a different user', async () => {
      const { token: differentUserToken } = await createTestUserWithSession({
        role: UserRole.USER,
      });
      const { user: normalUser } = await createTestUserWithSession({
        role: UserRole.USER,
        preferred_language: Language.EN,
        preferred_resolutions: [Resolution.R720P],
      });
      const UPDATED_USERNAME = `updated-username-${getRandomString(10)}`;

      const response = await client.api.users[':userId'].$put(
        {
          param: { userId: `${normalUser.id}` },
          json: {
            preferredLanguage: Language.HU,
            preferredResolutions: [Resolution.R2160P],
            username: UPDATED_USERNAME,
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${differentUserToken}` } },
      );
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/users/:userId/password', async () => {
    const OLD_PASSWORD = 'old-password';
    const oldPasswordHash = hashPassword(OLD_PASSWORD);
    const NEW_PASSWORD = 'new-password';
    it.each([
      {
        when: 'requested by admin',
        createUsers: async () => ({
          userToBeUpdated: await createTestUserWithSession({
            passwordHash: oldPasswordHash,
          }),
          requesterUser: await createTestUserWithSession({ role: UserRole.ADMIN }),
        }),
      },
      {
        when: 'requested by the user themselves',
        createUsers: async () => {
          const user = await createTestUserWithSession({ passwordHash: oldPasswordHash });
          return { userToBeUpdated: user, requesterUser: user };
        },
      },
    ])('should update user password when $when', async ({ createUsers }) => {
      const {
        requesterUser: { token },
        userToBeUpdated: { user },
      } = await createUsers();
      const response = await client.api.users[':userId'].password.$put(
        {
          param: { userId: `${user.id}` },
          json: {
            password: NEW_PASSWORD,
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('message', 'Password updated successfully');
      const userByOldCredentials = await getUserByCredentials({
        username: user.username,
        password: 'old-password',
      });
      expect(userByOldCredentials).toBeNull();
      const userByNewCredentials = await getUserByCredentials({
        username: user.username,
        password: NEW_PASSWORD,
      });
      expect(userByNewCredentials).not.toBeNull();
      expect(userByNewCredentials?.id).toBe(user.id);
    });

    it('should not update user password when requested by a different user', async () => {
      const { user: userToBeUpdated } = await createTestUserWithSession({
        passwordHash: oldPasswordHash,
      });
      const { token: differentUserToken } = await createTestUserWithSession({
        role: UserRole.USER,
      });

      const response = await client.api.users[':userId'].password.$put(
        {
          param: { userId: `${userToBeUpdated.id}` },
          json: {
            password: NEW_PASSWORD,
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${differentUserToken}` } },
      );
      expect(response.status).toBe(403);
      const userByOldCredentials = await getUserByCredentials({
        username: userToBeUpdated.username,
        password: OLD_PASSWORD,
      });
      expect(userByOldCredentials).not.toBeNull();
      expect(userByOldCredentials?.id).toBe(userToBeUpdated.id);
      const userByNewCredentials = await getUserByCredentials({
        username: userToBeUpdated.username,
        password: NEW_PASSWORD,
      });
      expect(userByNewCredentials).toBeNull();
    });
  });

  describe('PUT /api/users/:userId/token', () => {
    it.each([
      {
        when: 'requested by admin',
        createUsers: async () => ({
          userToBeUpdated: await createTestUserWithSession(),
          requesterUser: await createTestUserWithSession({ role: UserRole.ADMIN }),
        }),
      },
      {
        when: 'requested by the user themselves',
        createUsers: async () => {
          const user = await createTestUserWithSession({});
          return { userToBeUpdated: user, requesterUser: user };
        },
      },
    ])("should rotate user's token when $when", async ({ createUsers }) => {
      const {
        requesterUser: { token },
        userToBeUpdated: { user, token: oldToken },
      } = await createUsers();
      const response = await client.api.users[':userId'].token.$put(
        {
          param: { userId: `${user.id}` },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(response.status).toBe(200);
      if (response.status !== 200) return;
      const body = await response.json();
      expect(body).toHaveProperty('apiToken');
      expect(body.apiToken).toBeDefined();
      expect(body.apiToken).not.toBeNull();
      expect(body.apiToken).not.toBe(oldToken);
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('should delete user when requested by admin', async () => {
      const { token: adminToken } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });
      const { user: normalUser } = await createTestUserWithSession({
        role: UserRole.USER,
      });

      const response = await client.api.users[':userId'].$delete(
        {
          param: { userId: `${normalUser.id}` },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` } },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('message', 'User deleted successfully');
      const userAfterDeletion = await getTestUserById(normalUser.id);
      expect(userAfterDeletion).toBeNull();
    });

    it('should not delete user when requested by a non-admin', async () => {
      const { user: userToBeDeleted } = await createTestUserWithSession({
        role: UserRole.USER,
      });
      const { token: deleterUserToken } = await createTestUserWithSession({
        role: UserRole.USER,
      });

      const response = await client.api.users[':userId'].$delete(
        {
          param: { userId: `${userToBeDeleted.id}` },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${deleterUserToken}` } },
      );
      expect(response.status).toBe(403);
    });

    it('should not delete an admin user', async () => {
      const { token: adminToken } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });
      const { user: adminUserToBeDeleted } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });

      const response = await client.api.users[':userId'].$delete(
        {
          param: { userId: `${adminUserToBeDeleted.id}` },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${adminToken}` } },
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('message', 'Cannot delete an admin user.');
    });
  });
});

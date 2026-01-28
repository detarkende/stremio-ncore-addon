import { testClient } from 'hono/testing';
import { configureApp } from 'src/test-utils/config';
import { createTestUserWithSession } from 'src/test-utils/users';
import { SESSION_COOKIE_NAME } from 'src/app/auth/auth.constants';
import type { MockInstance } from 'vitest';
import { Language, Resolution, UserRole, usersTable } from 'src/db/schema/users';
import * as userUtils from 'src/app/user/user.utils';
import { db } from 'src/db';
import { configurationTable } from 'src/db/schema/configuration';
import { configRoutes } from '../config.routes';
import { ncoreService } from '../../ncore';
import { deleteOldTorrentsScheduler } from '../config.schedule';

describe('Config Routes', () => {
  const client = testClient(configRoutes);

  describe('GET /config/is-configured', () => {
    it('should return isConfigured as false when no configuration exists', async () => {
      const response = await client.api.config['is-configured'].$get();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ isConfigured: false });
    });

    it('should return isConfigured as true when configuration exists', async () => {
      // Insert a configuration into the database
      configureApp();

      const response = await client.api.config['is-configured'].$get();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ isConfigured: true });
    });

    it('should allow unauthenticated access', async () => {
      const responseWithoutAuth = await client.api.config['is-configured'].$get();
      expect(responseWithoutAuth.status).toBe(200);
    });

    it('should allow access to authenticated users', async () => {
      configureApp();
      const { token } = await createTestUserWithSession();

      const responseWithAuth = await client.api.config['is-configured'].$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(responseWithAuth.status).toBe(200);
    });
  });

  describe('GET /config', () => {
    it('should return 401 for unauthenticated users', async () => {
      const response = await client.api.config.$get();
      expect(response.status).toBe(401);
    });

    it('should return configuration for authenticated users', async () => {
      const testConfig = configureApp();
      const { token } = await createTestUserWithSession();

      const response = await client.api.config.$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual(expect.objectContaining(testConfig));
      expect(body).toHaveProperty('remoteUrl');
    });
  });

  describe('GET /config/issues', () => {
    let isNcoreAccessibleSpy: MockInstance<() => Promise<boolean>>;
    beforeEach(() => {
      isNcoreAccessibleSpy = vi.spyOn(ncoreService, 'isNcoreAccessible');
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should report no issues when nCore is accessible', async () => {
      isNcoreAccessibleSpy.mockResolvedValueOnce(true);
      const { token } = await createTestUserWithSession();
      const response = await client.api.config.issues.$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ isNcoreOk: true });
    });

    it('should report an issue when nCore is not accessible', async () => {
      isNcoreAccessibleSpy.mockResolvedValueOnce(false);

      const { token } = await createTestUserWithSession();
      const response = await client.api.config.issues.$get(
        {},
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        isNcoreOk: false,
      });
    });
  });

  describe('POST /config', () => {
    it('should allow unauthenticated users to configure the app', async () => {
      const scheduleSpy = vi.spyOn(deleteOldTorrentsScheduler, 'schedule');
      const adminUsername = 'adminUser';
      const adminPassword = 'testpassword';

      const response = await client.api.config.$post({
        json: {
          admin: {
            username: adminUsername,
            password: adminPassword,
            preferredLanguage: Language.EN,
            preferredResolutions: [Resolution.R720P, Resolution.R1080P],
          },
          localIp: '192.168.1.15',
          remoteUrl: '',
          deleteAfterHitnrun: {
            enabled: true,
            cron: '0 0 * * *',
          },
        },
      });

      expect(response.status).toBe(201);
      expect(scheduleSpy).toHaveBeenCalled();
      expect(await response.json()).toEqual({ message: 'Setup completed successfully.' });
      const adminUser = await userUtils.getUserByCredentials({
        username: adminUsername,
        password: adminPassword,
      });
      expect(adminUser).not.toBeNull();
      expect(adminUser?.role).toBe(UserRole.ADMIN);
      expect(adminUser?.preferredLanguage).toBe(Language.EN);
      expect(adminUser?.preferredResolutions).toEqual([
        Resolution.R720P,
        Resolution.R1080P,
      ]);

      const configs = db.select().from(configurationTable).all();
      expect(configs.length).toBe(1);
      expect(configs[0]).toEqual({
        id: 1,
        remoteUrl: null,
        localIp: '192.168.1.15',
        deleteAfterHitnrun: true,
        deleteAfterHitnrunCron: '0 0 * * *',
      });
    });

    it('should return 400 if configuration already exists', async () => {
      configureApp();

      const adminUsername = 'adminUser';
      const adminPassword = 'testpassword';
      const response = await client.api.config.$post({
        json: {
          admin: {
            username: adminUsername,
            password: adminPassword,
            preferredLanguage: Language.EN,
            preferredResolutions: [Resolution.R720P, Resolution.R1080P],
          },
          localIp: '192.168.1.15',
          remoteUrl: 'https://example.com/addon',
          deleteAfterHitnrun: {
            enabled: true,
            cron: '0 0 * * *',
          },
        },
      });
      expect(response.status).toBe(400);
      expect(await response.text()).toEqual('Config already exists.');
      expect(db.select().from(configurationTable).all().length).toBe(1);
      expect(db.select().from(usersTable).all().length).toBe(0);
    });

    it('should return 400 if admin username is already taken', async () => {
      const { user } = await createTestUserWithSession();
      const response = await client.api.config.$post({
        json: {
          admin: {
            username: user.username,
            password: 'anotherpassword',
            preferredLanguage: Language.EN,
            preferredResolutions: [Resolution.R720P, Resolution.R1080P],
          },
          localIp: '192.168.1.15',
          remoteUrl: 'https://example.com/addon',
          deleteAfterHitnrun: {
            enabled: true,
            cron: '0 0 * * *',
          },
        },
      });
      expect(response.status).toBe(400);
      expect(await response.text()).toEqual('Username is already taken.');
      expect(db.select().from(configurationTable).all().length).toBe(0);
    });

    it('should not save the configuration if the user creation fails', async () => {
      vi.spyOn(userUtils, 'createUserRequestToInsertStatement').mockImplementationOnce(
        () => {
          throw new Error('User creation failed');
        },
      );

      const response = await client.api.config.$post({
        json: {
          admin: {
            username: 'adminUser',
            password: 'testpassword',
            preferredLanguage: Language.EN,
            preferredResolutions: [Resolution.R720P, Resolution.R1080P],
          },
          localIp: '192.168.1.15',
          remoteUrl: 'https://example.com/addon',
          deleteAfterHitnrun: {
            enabled: true,
            cron: '0 0 * * *',
          },
        },
      });

      expect(response.status).toBe(500);
      expect(await response.text()).toEqual('An error occurred during setup.');
      expect(db.select().from(configurationTable).all().length).toBe(0);
      expect(db.select().from(usersTable).all().length).toBe(0);
    });
  });

  describe('PUT /config', () => {
    it('should allow admin users to update the configuration', async () => {
      const scheduleSpy = vi.spyOn(deleteOldTorrentsScheduler, 'schedule');
      configureApp({
        remoteUrl: undefined,
        localIp: '192.168.1.15',
        deleteAfterHitnrun: false,
        deleteAfterHitnrunCron: '',
      });
      const { token } = await createTestUserWithSession({
        role: UserRole.ADMIN,
      });

      const response = await client.api.config.$put(
        {
          json: {
            localIp: '192.168.1.11',
            remoteUrl: 'http://example.com/addon',
            deleteAfterHitnrun: {
              enabled: true,
              cron: '30 2 * * *',
            },
          },
        },
        { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        id: 1,
        remoteUrl: 'http://example.com/addon',
        localIp: '192.168.1.11',
        localUrl: 'https://192-168-1-11.local-ip.medicmobile.org:3443',
        deleteAfterHitnrun: true,
        deleteAfterHitnrunCron: '30 2 * * *',
      });
      expect(scheduleSpy).toHaveBeenCalled();

      const configs = db.select().from(configurationTable).all();
      expect(configs.length).toBe(1);
    });
  });
});

import { UserRole, Language, Resolution } from '@server/db/schema/users';
import { HttpStatusCode } from '@server/types/http';
import { Hono } from 'hono';
import mockFs from 'mock-fs';
import type { MockInstance } from 'vitest';

import * as UserUtils from '../../user/user.utils';
import { SESSION_COOKIE_NAME } from '../auth.constants';
import { useCookieAuth, useUrlTokenAuth } from '../auth.middleware';
import * as AuthUtils from '../auth.utils';

vi.mock('@server/env', () => ({
  env: {
    NODE_ENV: 'test',
    ADDON_DIR: '/addon-dir',
    NCORE_USERNAME: 'username',
    NCORE_PASSWORD: 'password',
  },
}));

describe('Auth Middlewares', () => {
  beforeEach(() => {
    mockFs({
      '/addon-dir': mockFs.directory(),
    });
  });

  afterEach(() => {
    mockFs.restore();
    vi.restoreAllMocks();
  });
  describe('useCookieAuth', () => {
    let validateSessionTokenMock: MockInstance<typeof AuthUtils.validateSessionToken>;

    beforeEach(() => {
      validateSessionTokenMock = vi.spyOn(AuthUtils, 'validateSessionToken');
    });
    it('should return HTTP 401 if no cookie is provided', async () => {
      const app = new Hono().get('/', useCookieAuth(), (c) => c.json({ ok: true }));

      const response = await app.request('/');

      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
    });

    it('should allow any user if "anyUser" is set', async () => {
      const app = new Hono().get('/', useCookieAuth(), (c) => c.json({ ok: true }));
      validateSessionTokenMock.mockResolvedValue({
        user: {
          id: 1,
          username: 'user',
          role: UserRole.USER,
          preferredLanguage: Language.EN,
          preferredResolutions: [Resolution.R720P],
          token: crypto.randomUUID(),
        },
        session: {
          id: 'session-id',
          userId: 1,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const response = await app.request('/', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=cookie` },
      });

      expect(response.status).toBe(HttpStatusCode.OK);
    });

    it('should return HTTP 401 if user is not admin and "adminOnly" is set', async () => {
      const app = new Hono().get('/', useCookieAuth('adminOnly'), (c) =>
        c.json({ ok: true }),
      );
      validateSessionTokenMock.mockResolvedValue({
        user: {
          id: 1,
          username: 'user',
          role: UserRole.USER,
          preferredLanguage: Language.EN,
          preferredResolutions: [Resolution.R720P],
          token: crypto.randomUUID(),
        },
        session: {
          id: 'session-id',
          userId: 1,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const response = await app.request('/', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=cookie` },
      });

      expect(response.status).toBe(HttpStatusCode.FORBIDDEN);
    });

    it('should allow if user is admin and "adminOnly" is set', async () => {
      const app = new Hono().get('/', useCookieAuth('adminOnly'), (c) =>
        c.json({ ok: true }),
      );
      validateSessionTokenMock.mockResolvedValue({
        user: {
          id: 1,
          username: 'admin',
          role: UserRole.ADMIN,
          preferredLanguage: Language.EN,
          preferredResolutions: [Resolution.R720P],
          token: crypto.randomUUID(),
        },
        session: {
          id: 'session-id',
          userId: 1,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const response = await app.request('/', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=cookie` },
      });

      expect(response.status).toBe(HttpStatusCode.OK);
    });

    it('should return HTTP 401 if user is not admin or self and "adminOrSelfOnly" is set', async () => {
      const app = new Hono().get('/:userId', useCookieAuth('adminOrSelfOnly'), (c) =>
        c.json({ ok: true }),
      );
      validateSessionTokenMock.mockResolvedValue({
        user: {
          id: 1,
          username: 'user',
          role: UserRole.USER,
          preferredLanguage: Language.EN,
          preferredResolutions: [Resolution.R720P],
          token: crypto.randomUUID(),
        },
        session: {
          id: 'session-id',
          userId: 1,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const response = await app.request('/2', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=cookie` },
      });

      expect(response.status).toBe(HttpStatusCode.FORBIDDEN);
    });

    it('should allow if user is self and "adminOrSelfOnly" is set', async () => {
      const app = new Hono().get('/:userId', useCookieAuth('adminOrSelfOnly'), (c) =>
        c.json({ ok: true }),
      );
      validateSessionTokenMock.mockResolvedValue({
        user: {
          id: 1,
          username: 'user',
          role: UserRole.USER,
          preferredLanguage: Language.EN,
          preferredResolutions: [Resolution.R720P],
          token: crypto.randomUUID(),
        },
        session: {
          id: 'session-id',
          userId: 1,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const response = await app.request('/1', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=cookie` },
      });

      expect(response.status).toBe(HttpStatusCode.OK);
    });

    it('should allow if user is admin and "adminOrSelfOnly" is set', async () => {
      const app = new Hono().get('/:userId', useCookieAuth('adminOrSelfOnly'), (c) =>
        c.json({ ok: true }),
      );
      validateSessionTokenMock.mockResolvedValue({
        user: {
          id: 1,
          username: 'admin',
          role: UserRole.ADMIN,
          preferredLanguage: Language.EN,
          preferredResolutions: [Resolution.R720P],
          token: crypto.randomUUID(),
        },
        session: {
          id: 'session-id',
          userId: 1,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });

      const response = await app.request('/2', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=cookie` },
      });

      expect(response.status).toBe(HttpStatusCode.OK);
    });
  });

  describe('useUrlTokenAuth', () => {
    let getUserByTokenMock: MockInstance<typeof UserUtils.getUserByToken>;

    beforeEach(() => {
      getUserByTokenMock = vi.spyOn(UserUtils, 'getUserByToken');
    });
    it('should return HTTP 401 if token is invalid', async () => {
      getUserByTokenMock.mockResolvedValue(null);
      const app = new Hono().get('/:token', useUrlTokenAuth(), (c) =>
        c.json({ ok: true }),
      );

      const response = await app.request('/invalid-token');

      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
    });

    it('should allow if token is valid and adminOnly is false', async () => {
      getUserByTokenMock.mockResolvedValue({
        id: 1,
        username: 'user',
        role: UserRole.USER,
        preferredLanguage: Language.EN,
        preferredResolutions: [Resolution.R720P],
        token: crypto.randomUUID(),
      });
      const app = new Hono().get('/:token', useUrlTokenAuth(), (c) =>
        c.json({ ok: true }),
      );

      const response = await app.request('/valid-token');

      expect(response.status).toBe(HttpStatusCode.OK);
    });

    it('should return HTTP 401 if token is valid but user is not admin and adminOnly is true', async () => {
      getUserByTokenMock.mockResolvedValue({
        id: 1,
        username: 'user',
        role: UserRole.USER,
        preferredLanguage: Language.EN,
        preferredResolutions: [Resolution.R720P],
        token: crypto.randomUUID(),
      });
      const app = new Hono().get('/:token', useUrlTokenAuth({ adminOnly: true }), (c) =>
        c.json({ ok: true }),
      );

      const response = await app.request('/valid-token');

      expect(response.status).toBe(HttpStatusCode.FORBIDDEN);
    });
  });
});

import { db } from '@server/db';
import { sessionsTable } from '@server/db/schema/sessions';
import { createTestUser } from '@server/test-utils/users';
import { eq } from 'drizzle-orm';

import { SESSION_MAX_DURATION } from '../auth.constants';
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  validateSessionToken,
} from '../auth.utils';

vi.mock('@server/env', () => ({
  env: {
    NODE_ENV: 'test',
    ADDON_DIR: '/addon-dir',
    NCORE_USERNAME: 'username',
    NCORE_PASSWORD: 'password',
  },
}));

describe('Auth utils', () => {
  describe('generateSessionToken', () => {
    it('should always generate a token of the correct length', () => {
      const tokenCount = 1000;
      const tokens = Array.from({ length: tokenCount }, () => generateSessionToken());

      for (const token of tokens) {
        expect(token).toHaveLength(32);
      }
      expect(new Set(tokens).size).toBe(tokenCount); // Ensure all tokens are unique
    });
  });
  describe('createSession', () => {
    it('should create a session in the database and return it', async () => {
      const user = await createTestUser();
      const token = generateSessionToken();
      const currentTime = Date.now();

      const session = await createSession(token, user.id);

      expect(session).toHaveProperty('id');
      expect(session.id).not.toEqual(token); // session ID should be a hash of the token
      expect(session).toHaveProperty('userId', user.id);
      expect(session).toHaveProperty('expiresAt');
      expect(Number(session.expiresAt)).toBeGreaterThanOrEqual(
        currentTime + SESSION_MAX_DURATION,
      );
    });
  });
  describe('validateSessionToken', () => {
    it('should return nulls for invalid session token', async () => {
      const result = await validateSessionToken('invalid-token');
      expect(result).toEqual({ session: null, user: null });
    });
    it('should return nulls for expired session and delete it', async () => {
      const user = await createTestUser();
      const token = generateSessionToken();
      const session = await createSession(token, user.id);
      // Manually expire the session
      await db
        .update(sessionsTable)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(sessionsTable.id, session.id));

      const result = await validateSessionToken(token);

      expect(result).toEqual({ session: null, user: null });
    });
    it('should refresh session if within refresh interval', async () => {
      const dbUpdateSpy = vi.spyOn(db, 'update');
      const user = await createTestUser();
      const token = generateSessionToken();
      const session = await createSession(token, user.id);
      // Manually set the session to be within the refresh interval
      const nearExpiryTime = Date.now() + 2 * 60 * 1000; // 2 minutes from now
      await db
        .update(sessionsTable)
        .set({ expiresAt: new Date(nearExpiryTime) })
        .where(eq(sessionsTable.id, session.id));

      const result = await validateSessionToken(token);

      expect(result.session).not.toBeNull();
      expect(result.user).not.toBeNull();
      expect(result.session?.id).toBe(session.id);
      expect(dbUpdateSpy).toHaveBeenCalledWith(sessionsTable);
      expect(result.session?.expiresAt.getTime()).toBeGreaterThan(nearExpiryTime);
    });
    it('should return session and user for valid session', async () => {
      const user = await createTestUser();
      const token = generateSessionToken();
      const session = await createSession(token, user.id);

      const result = await validateSessionToken(token);

      expect(result.session).not.toBeNull();
      expect(result.user).not.toBeNull();
      expect(result.session?.id).toBe(session.id);
      expect(result.user?.id).toBe(user.id);
    });
  });
  describe('invalidateSession', () => {
    it('should delete the session from the database', async () => {
      const user = await createTestUser();
      const token = generateSessionToken();
      const session = await createSession(token, user.id);

      await invalidateSession(session.id);

      const [deletedSession] = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, session.id));
      expect(deletedSession).toBeUndefined();
    });
  });
});

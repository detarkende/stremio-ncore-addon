import { usersTable } from '@/db/schema/users';
import { Session, sessionsTable } from '@/db/schema/sessions';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { Database } from '@/db';
import { eq } from 'drizzle-orm';
import { SESSION_MAX_DURATION, SESSION_REFRESH_INTERVAL_MS } from './constants';
import { User } from '@/types/user';

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export class SessionService {
  constructor(private db: Database) {}

  public generateSessionToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
  }

  public async createSession(token: string, userId: number): Promise<Session> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_DURATION),
    };
    const [createdSession] = await this.db
      .insert(sessionsTable)
      .values(session)
      .returning();
    return createdSession;
  }

  public async validateSessionToken(token: string): Promise<SessionValidationResult> {
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const result = await this.db
      .select({ user: usersTable, session: sessionsTable })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(eq(sessionsTable.id, sessionId));
    if (result.length < 1) {
      return { session: null, user: null };
    }
    const { user, session } = result[0];
    if (Date.now() >= session.expiresAt.getTime()) {
      await this.db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
      return { session: null, user: null };
    }
    if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_INTERVAL_MS) {
      session.expiresAt = new Date(Date.now() + SESSION_MAX_DURATION);
      await this.db
        .update(sessionsTable)
        .set({
          expiresAt: session.expiresAt,
        })
        .where(eq(sessionsTable.id, session.id));
    }

    return { session, user: new User(user) };
  }

  public async invalidateSession(sessionId: string): Promise<void> {
    await this.db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }
}

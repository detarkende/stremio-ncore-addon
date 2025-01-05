import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users';

export const sessionsTable = sqliteTable('sessions', {
  id: text().primaryKey(),
  userId: integer()
    .references(() => usersTable.id)
    .notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
});

export type Session = {
  id: string;
  userId: number;
  expiresAt: Date;
};

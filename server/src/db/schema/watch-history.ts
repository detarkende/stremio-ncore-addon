import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users';
import { sql } from 'drizzle-orm';

export const watchHistoryTable = sqliteTable('watch_history', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer()
    .references(() => usersTable.id)
    .notNull(),
  type: text().notNull(),
  imdbId: text().notNull(),
  watchedAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users';

export const deviceTokensTable = sqliteTable('device_tokens', {
  id: integer().primaryKey({ autoIncrement: true }),
  token: text().unique().notNull(),
  name: text().notNull(),
  userId: integer()
    .references(() => usersTable.id)
    .notNull(),
});

export type DeviceToken = {
  id: number;
  token: string;
  name: string;
  userId: number;
};

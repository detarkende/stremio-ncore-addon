import { streamTypeValues } from '@server/app/stream/stream.constants';
import { languageValues, userRoleValues } from '@server/app/user/user.constants';
import type { Language, Resolution, UserRole } from '@server/app/user/user.types';
import { sql } from 'drizzle-orm';
import { blob, integer, snakeCase, text } from 'drizzle-orm/sqlite-core';

export const configurationTable = snakeCase.table('configuration', {
  id: integer().primaryKey({ autoIncrement: true }),
  localIp: text().notNull(),
  remoteUrl: text(),
  deleteAfterHitnrun: integer({ mode: 'boolean' }).notNull().default(false),
  deleteAfterHitnrunCron: text().notNull().default('0 2 * * *'),
});

export const usersTable = snakeCase.table('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  role: text({ enum: userRoleValues }).$type<UserRole>().notNull(),
  preferred_resolutions: text({ mode: 'json' }).$type<Resolution[]>().notNull(),
  preferred_language: text({ enum: languageValues }).$type<Language>().notNull(),
  token: text().notNull().unique(),
  token_rotated_at: integer({ mode: 'timestamp' }).notNull(),
});

export const torrentsTable = snakeCase.table('torrents', {
  infoHash: text().primaryKey(),
  type: text({ enum: streamTypeValues }).notNull(),
  name: text().notNull(),
  bitfield: blob({ mode: 'buffer' }).$type<Uint8Array>().notNull(),
  torrentFile: blob({ mode: 'buffer' }).$type<Buffer>().notNull(),
  imdbId: text().notNull(),
});

export const usersTorrentsTable = snakeCase.table('users_torrents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  torrentInfoHash: text('torrent_info_hash')
    .notNull()
    .references(() => torrentsTable.infoHash, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const sessionsTable = snakeCase.table('sessions', {
  id: text().primaryKey(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
});

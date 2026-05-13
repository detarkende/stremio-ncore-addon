import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { torrentsTable } from './torrents';
import { usersTable } from './users';

export const usersTorrentsTable = sqliteTable('users_torrents', {
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

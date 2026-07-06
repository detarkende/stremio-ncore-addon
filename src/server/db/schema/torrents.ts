import { streamTypeValues } from '@server/app/stream/stream.constants';
import { sqliteTable, text, blob } from 'drizzle-orm/sqlite-core';

export const torrentsTable = sqliteTable('torrents', {
  infoHash: text().primaryKey(),
  type: text({ enum: streamTypeValues }).notNull(),
  name: text().notNull(),
  bitfield: blob({ mode: 'buffer' }).$type<Uint8Array>().notNull(),
  torrentFile: blob({ mode: 'buffer' }).$type<Buffer>().notNull(),
  imdbId: text().notNull(),
});

export type DbTorrent = typeof torrentsTable.$inferSelect;

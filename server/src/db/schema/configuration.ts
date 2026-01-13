import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const configurationTable = sqliteTable('configuration', {
  id: integer().primaryKey({ autoIncrement: true }),
  localIp: text().notNull(),
  remoteUrl: text(),
  deleteAfterHitnrun: integer({ mode: 'boolean' }).notNull().default(false),
  deleteAfterHitnrunCron: text().notNull().default('0 2 * * *'),
});

export type Configuration = typeof configurationTable.$inferSelect;
export type ConfigurationResponse = Configuration & {
  localUrl: string;
};

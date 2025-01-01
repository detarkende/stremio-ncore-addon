import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const configurationTable = sqliteTable('configuration', {
  id: integer().primaryKey({ autoIncrement: true }),
  addonUrl: text().notNull(),
  ncoreUsername: text().notNull(),
  ncorePassword: text().notNull(),
  deleteAfterHitnrun: integer({ mode: 'boolean' }).notNull().default(false),
  deleteAfterHitnrunCron: text().notNull().default('0 2 * * *'),
});

export type Configuration = {
  id: number;
  addonUrl: string;
  ncoreUsername: string;
  ncorePassword: string;
  deleteAfterHitnrun: boolean;
  deleteAfterHitnrunCron: string;
};

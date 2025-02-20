import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const configurationTable = sqliteTable('configuration', {
  id: integer().primaryKey({ autoIncrement: true }),
  localOnly: integer({ mode: 'boolean' }).notNull().default(false),
  addonUrl: text().notNull(),
  deleteAfterHitnrun: integer({ mode: 'boolean' }).notNull().default(false),
  deleteAfterHitnrunCron: text().notNull().default('0 2 * * *'),
});

export type Configuration = {
  id: number;
  localOnly: boolean;
  addonUrl: string;
  deleteAfterHitnrun: boolean;
  deleteAfterHitnrunCron: string;
};

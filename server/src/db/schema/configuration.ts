import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const configurationTable = sqliteTable('configuration', {
  id: integer().primaryKey({ autoIncrement: true }),
  localOnly: integer({ mode: 'boolean' }).notNull().default(false),
  // If remotely accessible, this is an URL, otherwise it's the local IP of the host
  addonLocation: text().notNull(),
  deleteAfterHitnrun: integer({ mode: 'boolean' }).notNull().default(false),
  deleteAfterHitnrunCron: text().notNull().default('0 2 * * *'),
});

export interface Configuration {
  id: number;
  localOnly: boolean;
  // If remotely accessible, this is an URL, otherwise it's the local IP of the host
  addonLocation: string;
  deleteAfterHitnrun: boolean;
  deleteAfterHitnrunCron: string;
}

export interface ConfigurationResponse extends Configuration {
  // The URL where the addon is hosted. Calculated based on addonLocation and localOnly.
  addonUrl: string;
}

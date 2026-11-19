import type { configurationTable } from '@server/db/schema';

export type Configuration = typeof configurationTable.$inferSelect;
export type ConfigurationResponse = Configuration & {
  localUrl: string;
};

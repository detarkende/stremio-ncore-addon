import type { Configuration } from 'src/db/schema/configuration';
import { db } from 'src/db';
import { configurationTable } from 'src/db/schema/configuration';

const defaultConfig: Configuration = {
  id: 1,
  addonLocation: '192.168.1.5',
  deleteAfterHitnrun: false,
  deleteAfterHitnrunCron: '0 2 * * *',
  localOnly: true,
};

export function configureApp(
  config: Partial<Omit<Configuration, 'id'>> = {},
): Configuration {
  const configToInsert = { ...defaultConfig, ...config };

  return db.insert(configurationTable).values(configToInsert).returning().get();
}

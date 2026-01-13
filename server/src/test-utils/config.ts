import type { Configuration } from 'src/db/schema/configuration';
import { db } from 'src/db';
import { configurationTable } from 'src/db/schema/configuration';

const defaultConfig: Configuration = {
  id: 1,
  localIp: '192.168.1.5',
  remoteUrl: 'http://my-addon.com',
  deleteAfterHitnrun: false,
  deleteAfterHitnrunCron: '0 2 * * *',
};

export function configureApp(
  config: Partial<Omit<Configuration, 'id'>> = {},
): Configuration {
  const configToInsert = { ...defaultConfig, ...config };

  return db.insert(configurationTable).values(configToInsert).returning().get();
}

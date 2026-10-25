import type {
  Configuration,
  ConfigurationResponse,
} from '@server/app/config/config.types';
import { db } from '@server/db';
import { configurationTable } from '@server/db/schema';

const defaultConfig: Configuration = {
  id: 1,
  localIp: '192.168.1.5',
  remoteUrl: 'http://my-addon.com',
  deleteAfterHitnrun: false,
  deleteAfterHitnrunCron: '0 2 * * *',
};

export function configureApp(
  config: Partial<Omit<ConfigurationResponse, 'id'>> = {},
): Configuration {
  const configToInsert = { ...defaultConfig, ...config };

  return db.insert(configurationTable).values(configToInsert).returning().get();
}

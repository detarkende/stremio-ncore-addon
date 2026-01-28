import { db } from 'src/db';
import {
  configurationTable,
  type ConfigurationResponse,
} from 'src/db/schema/configuration';
import { env } from 'src/env';
import type { UpdateConfigRequest } from 'src/schemas/config.schema';
import { getLocalIpUrl } from 'src/utils/https';

export function getConfig(): ConfigurationResponse | null {
  const config = db.select().from(configurationTable).limit(1).get();
  if (!config) {
    return null;
  }
  return {
    ...config,
    localUrl: getLocalIpUrl(config.localIp, env.HTTPS_PORT),
  };
}

export function configRequestToInsertStatement(
  data: UpdateConfigRequest,
): typeof configurationTable.$inferInsert {
  return {
    localIp: data.localIp,
    remoteUrl: data.remoteUrl || null,
    deleteAfterHitnrun: data.deleteAfterHitnrun.enabled,
    deleteAfterHitnrunCron: data.deleteAfterHitnrun.cron,
  };
}

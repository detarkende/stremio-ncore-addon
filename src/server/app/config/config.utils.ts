import { db } from '@server/db';
import {
  configurationTable,
  type ConfigurationResponse,
} from '@server/db/schema/configuration';
import { env } from '@server/env';
import type { UpdateConfigRequest } from '@server/schemas/config.schema';
import { getLocalIpUrl } from '@server/utils/https';

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

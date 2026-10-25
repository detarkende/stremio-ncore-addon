import { db } from '@server/db';
import { configurationTable } from '@server/db/schema';
import { env } from '@server/env';
import type { UpdateConfigRequest } from '@server/schemas/config.schema';
import { getLocalIpUrl } from '@server/utils/https';

import { type ConfigurationResponse } from './config.types';

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

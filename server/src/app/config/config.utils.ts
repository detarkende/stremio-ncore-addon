import { db } from 'src/db';
import {
  configurationTable,
  type ConfigurationResponse,
} from 'src/db/schema/configuration';
import { env } from 'src/env';
import type { UpdateConfigRequest } from 'src/schemas/config.schema';
import { getLocalIpUrl } from 'src/utils/https';

export function getAddonUrl(addonLocation: string, localOnly: boolean): string {
  if (localOnly) {
    return getLocalIpUrl(addonLocation, env.HTTPS_PORT);
  }
  return addonLocation;
}

export function getConfig(): ConfigurationResponse | null {
  const config = db.select().from(configurationTable).limit(1).get();
  if (!config) {
    return null;
  }
  return {
    ...config,
    addonUrl: getAddonUrl(config.addonLocation, config.localOnly),
  };
}

export function configRequestToInsertStatement(
  data: UpdateConfigRequest,
): typeof configurationTable.$inferInsert {
  return {
    addonLocation: data.addonLocation.location,
    deleteAfterHitnrun: data.deleteAfterHitnrun.enabled,
    deleteAfterHitnrunCron: data.deleteAfterHitnrun.cron,
    localOnly: data.addonLocation.local,
  };
}

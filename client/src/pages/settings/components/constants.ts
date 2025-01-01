import { Configuration } from '@server/db/schema/configuration';
import { UpdateConfigRequest } from '@server/schemas/config.schema';

export const getUpdateAddonSettingsDefaultValues = (
  config: Configuration,
): UpdateConfigRequest => {
  return {
    addonUrl: config.addonUrl,
    deleteAfterHitnrun: config.deleteAfterHitnrun
      ? {
          enabled: true,
          cron: config.deleteAfterHitnrunCron,
        }
      : {
          enabled: false,
          cron: '',
        },
    ncoreUsername: config.ncoreUsername,
    ncorePassword: config.ncorePassword,
  };
};

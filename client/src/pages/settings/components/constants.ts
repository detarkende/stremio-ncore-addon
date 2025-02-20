import { Configuration } from '@server/db/schema/configuration';
import { UpdateConfigRequest } from '@server/schemas/config.schema';

export const getUpdateAddonSettingsDefaultValues = (
  config: Configuration,
): UpdateConfigRequest => {
  return {
    addonUrl: config.localOnly
      ? {
          url: '',
          local: true,
        }
      : {
          url: config.addonUrl,
          local: false,
        },
    deleteAfterHitnrun: config.deleteAfterHitnrun
      ? {
          enabled: true,
          cron: config.deleteAfterHitnrunCron,
        }
      : {
          enabled: false,
          cron: '',
        },
  };
};

import { Configuration } from '@server/db/schema/configuration';
import { UpdateConfigRequest } from '@server/schemas/config.schema';

export const getUpdateAddonSettingsDefaultValues = (
  config: Configuration,
): UpdateConfigRequest => {
  return {
    addonLocation: {
      local: config.localOnly,
      location: config.addonLocation,
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

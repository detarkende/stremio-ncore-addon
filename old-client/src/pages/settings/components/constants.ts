import { ConfigurationResponse } from '@sna/server';
import { UpdateConfigRequest } from '@sna/server';

export const getUpdateAddonSettingsDefaultValues = (
  config: ConfigurationResponse,
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

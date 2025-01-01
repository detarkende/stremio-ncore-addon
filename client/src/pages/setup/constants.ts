import type { CreateConfigRequest } from '@server/schemas/config.schema';
import { Language, languageValues } from '@server/db/schema/users';

export type SetupFormValues = CreateConfigRequest;

export const defaultSetupFormValues: SetupFormValues = {
  addonUrl: '',
  ncoreUsername: '',
  ncorePassword: '',
  admin: {
    username: '',
    password: '',
    preferredResolutions: [],
    preferredLanguage: languageValues[0],
  },
  nonAdminUsers: [],
  deleteAfterHitnrun: {
    enabled: false,
    cron: '',
  },
};

export const DEFAULT_HITNRUN_CRON = '0 2 * * *';

export const languageLabelLookup: Record<Language, string> = {
  en: 'English',
  hu: 'Hungarian',
};

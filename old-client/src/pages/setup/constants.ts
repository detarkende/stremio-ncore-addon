import type { CreateConfigRequest } from '@sna/server';
import { Language, languageValues } from '@sna/server';

export type SetupFormValues = CreateConfigRequest;

export const defaultSetupFormValues: SetupFormValues = {
  addonLocation: {
    local: false,
    location: '',
  },
  admin: {
    username: '',
    password: '',
    preferredResolutions: [],
    preferredLanguage: languageValues[0],
  },
  deleteAfterHitnrun: {
    enabled: false,
    cron: '',
  },
};

export const DEFAULT_HITNRUN_CRON = '0 2 * * *';

export const languageLabelLookup: Record<string, string> = {
  en: 'English',
  hu: 'Hungarian',
} satisfies Record<Language, string>;

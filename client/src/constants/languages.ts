import { Language } from '@sna/server';
import type { SelectOption } from '@/components/form/fields/select';

export const languageLabelMap: Record<Language, string> = {
  [Language.EN]: 'English',
  [Language.HU]: 'Hungarian',
};

export const languageOptions: SelectOption<Language>[] = Object.values(Language).map(
  (value) => ({
    label: languageLabelMap[value],
    value,
  }),
);

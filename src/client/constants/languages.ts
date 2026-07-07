import type { SelectOption } from '@client/components/form/fields/select';
import { Language } from '@server/exports';

const languageLabelMap: Record<Language, string> = {
  [Language.EN]: 'English',
  [Language.HU]: 'Hungarian',
};

export const languageOptions: SelectOption<Language>[] = Object.values(Language).map(
  (value) => ({
    label: languageLabelMap[value],
    value,
  }),
);

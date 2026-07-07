import { Language } from '@server/db/schema/users';

export enum StreamType {
  MOVIE = 'movie',
  TV_SHOW = 'series',
}

export const streamTypeValues = [StreamType.MOVIE, StreamType.TV_SHOW] as const;

export const languageEmojiMap: Record<Language, string> = {
  [Language.HU]: '🇭🇺',
  [Language.EN]: '🇬🇧',
};

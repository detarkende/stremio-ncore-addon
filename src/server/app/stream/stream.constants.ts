import { Language } from '@server/db/schema/users';

export const StreamType = {
  MOVIE: 'movie',
  TV_SHOW: 'series',
} as const;
export type StreamType = (typeof StreamType)[keyof typeof StreamType];

export const streamTypeValues = [StreamType.MOVIE, StreamType.TV_SHOW] as const;

export const languageEmojiMap: Record<Language, string> = {
  [Language.HU]: '🇭🇺',
  [Language.EN]: '🇬🇧',
};

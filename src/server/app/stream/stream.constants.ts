import { Language } from '@server/db/schema/users';
import { z } from 'zod';

export enum StreamType {
  MOVIE = 'movie',
  TV_SHOW = 'series',
}

export const streamTypeValues = [StreamType.MOVIE, StreamType.TV_SHOW] as const;

export const listStreamsParamsSchema = z.object({
  token: z.string(),
  type: z.nativeEnum(StreamType),
  imdbId: z
    .string()
    .startsWith('tt')
    .regex(/tt\d+(:\d+:\d+)?(\.json)?$/)
    .transform((imdbId) => imdbId.replace(/\.json$/, '')),
});

export const playStreamParamsSchema = listStreamsParamsSchema.omit({ token: true }).and(
  z.object({
    torrentSourceId: z.string().min(1),
    infoHash: z.string().min(1),
    filePath: z.string().min(1),
  }),
);

export const languageEmojiMap: Record<Language, string> = {
  [Language.HU]: '🇭🇺',
  [Language.EN]: '🇬🇧',
};

export const cinemetaResponseSchema = z.object({
  meta: z.object({
    imdb_id: z.string(),
    name: z.string(),
    type: z.nativeEnum(StreamType),
  }),
});

export type CinemetaResponse = z.infer<typeof cinemetaResponseSchema>;

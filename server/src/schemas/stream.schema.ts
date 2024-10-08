import { z } from 'zod';

export enum StreamType {
  MOVIE = 'movie',
  TV_SHOW = 'series',
}

const imdbSchema = z.string().startsWith('tt').endsWith('.json');

export const streamQuerySchema = z
  .object({ jwt: z.string() })
  .and(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal(StreamType.MOVIE),
        imdbId: imdbSchema,
      }),
      z.object({
        type: z.literal(StreamType.TV_SHOW),
        imdbId: imdbSchema.regex(
          /tt\d+:\d+:\d+/,
          "IMDB ID doesn't contain season and episode numbers",
        ),
      }),
    ]),
  )
  .transform((data) => {
    if (data.type === StreamType.TV_SHOW) {
      const [imdbId, season, episode] = data.imdbId.split(':') as [string, string, string];
      return {
        ...data,
        imdbId,
        season: parseInt(season),
        episode: parseInt(episode),
      };
    }
    return { ...data, season: undefined, episode: undefined };
  });

export type StreamQuery = z.infer<typeof streamQuerySchema>;

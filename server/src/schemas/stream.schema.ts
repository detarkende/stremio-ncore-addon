import { z } from 'zod';

export enum StreamType {
  MOVIE = 'movie',
  TV_SHOW = 'series',
}

const idSchema = z
  .string()
  .refine((id) => id.startsWith('tt') || id.startsWith('ncore:'), {
    message: "ID must start with 'tt' or 'ncore:'",
  })
  .refine((id) => id.endsWith('.json'), {
    message: "ID must end with '.json'",
  });

export const streamQuerySchema = z
  .object({ deviceToken: z.string() })
  .and(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal(StreamType.MOVIE),
        imdbId: idSchema,
      }),
      z.object({
        type: z.literal(StreamType.TV_SHOW),
        imdbId: idSchema,
      }),
    ]),
  )
  .transform((data) => {
    if (data.imdbId.startsWith('tt') && data.type === StreamType.TV_SHOW) {
      const [imdbId, season, episode] = data.imdbId.split(':') as [
        string,
        string,
        string,
      ];
      return {
        ...data,
        imdbId,
        season: parseInt(season),
        episode: parseInt(episode),
      };
    }
    return {
      ...data,
      imdbId: data.imdbId.replace('.json', ''),
      season: undefined,
      episode: undefined,
    };
  });

export type StreamQuery = z.infer<typeof streamQuerySchema>;

import { z } from 'zod';

export const playSchema = z.object({
  jwt: z.string(),
  sourceName: z.string(),
  sourceId: z.string(),
  infoHash: z.string(),
  fileIdx: z.coerce.number(),
});

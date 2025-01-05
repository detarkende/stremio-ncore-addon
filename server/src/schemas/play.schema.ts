import { z } from 'zod';

export const playSchema = z.object({
  deviceToken: z.string(),
  sourceName: z.string(),
  sourceId: z.string(),
  infoHash: z.string(),
  fileIdx: z.coerce.number(),
});

import { z } from 'zod';

export const metadataQuerySchema = z.object({
  deviceToken: z.string(),
  id: z.string(),
  type: z.string(),
});

export type GetMetadataRequest = z.infer<typeof metadataQuerySchema>;

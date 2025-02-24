import { z } from 'zod';

const ncoreSchema = z.string().startsWith('ncore:').endsWith('.json');

export const metadataQuerySchema = z.object({
  deviceToken: z.string(),
  ncoreId: ncoreSchema,
  type: z.string(),
});

export type GetMetadataRequest = z.infer<typeof metadataQuerySchema>;

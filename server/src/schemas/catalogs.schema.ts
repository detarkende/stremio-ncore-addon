import { z } from 'zod';

export const catalogQuerySchema = z.object({
  deviceToken: z.string(),
  values: z.string().optional(),
  type: z.string(),
});

export type GetCatalogRequest = z.infer<typeof catalogQuerySchema>;

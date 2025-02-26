import { FlixPatrolPlatform } from '@/services/catalog/constants';
import { z } from 'zod';

export const catalogQuerySchema = z.object({
  deviceToken: z.string(),
  values: z.string().optional(),
  type: z.string(),
});

export const platformCatalogQuerySchema = z.object({
  deviceToken: z.string(),
  platform: z
    .string()
    .transform((val: string) => val.replace('.json', '') as FlixPatrolPlatform)
    .refine((val) => Object.values(FlixPatrolPlatform).includes(val), {
      message: 'Invalid platform',
    }),
  type: z.string(),
});

export type GetCatalogRequest = z.infer<typeof catalogQuerySchema>;
export type GetPlatformCatalogRequest = z.infer<typeof platformCatalogQuerySchema>;

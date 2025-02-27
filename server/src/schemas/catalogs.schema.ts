import { Platform } from '@/services/catalog/constants';
import { z } from 'zod';
import { StreamType } from '@/schemas/stream.schema';

export const catalogQuerySchema = z.object({
  deviceToken: z.string(),
  values: z.string().optional(),
  type: z.nativeEnum(StreamType),
});

export const platformCatalogQuerySchema = z.object({
  deviceToken: z.string(),
  platform: z
    .string()
    .transform((val: string) => val.replace('.json', '') as Platform)
    .refine((val) => Object.values(Platform).includes(val), {
      message: 'Invalid platform',
    }),
  values: z.string().optional(),
  type: z.string(),
});

export type GetCatalogRequest = z.infer<typeof catalogQuerySchema>;
export type GetPlatformCatalogRequest = z.infer<typeof platformCatalogQuerySchema>;

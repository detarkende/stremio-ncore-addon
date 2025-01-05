import type { CreateDeviceTokenInput } from '@server/schemas/device-token.schema';
import { DefaultValues } from 'react-hook-form';
import { z } from 'zod';

export const createDeviceTokenSchema: z.ZodSchema<CreateDeviceTokenInput> = z.object({
  name: z.string().min(1),
});

export type CreateDeviceTokenFormValues = z.infer<typeof createDeviceTokenSchema>;

export const defaultCreateDeviceTokenFormValues: DefaultValues<CreateDeviceTokenFormValues> =
  {
    name: '',
  };

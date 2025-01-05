import { z } from 'zod';

export const createDeviceTokenSchema = z.object({
  name: z.string().min(1),
});

export type CreateDeviceTokenInput = z.infer<typeof createDeviceTokenSchema>;

export const deleteDeviceTokenSchema = z.object({
  token: z.string(),
});

export type DeleteDeviceTokenInput = z.infer<typeof deleteDeviceTokenSchema>;

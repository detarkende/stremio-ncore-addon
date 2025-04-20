import { z } from 'zod';

export const localIpResponseSchema = z.object({
  privkey: z.string(),
  cert: z.string(),
  chain: z.string(),
  fullchain: z.string(),
});

export type LocalIpResponse = z.infer<typeof localIpResponseSchema>;

export const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

import { z } from 'zod';

export const playSchema = z.object({
	jwt: z.string(),
	ncoreId: z.string(),
	infoHash: z.string(),
	fileIdx: z.coerce.number(),
});
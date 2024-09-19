import { z } from 'zod';
import { resolutionSchema } from './resolution.schema';
import { languageSchema } from './language.schema';

export enum UserRole {
	ADMIN = 'admin',
	USER = 'user',
}

export const userSchema = z
	.object({
		username: z.string({ required_error: 'Username is required' }),
		password: z.string({ required_error: 'Password is required' }),
		preferred_lang: languageSchema,
		preferred_resolutions: z.array(resolutionSchema),
	})
	.refine(
		(data) => {
			if ('second_preferred_lang' in data) {
				return data.preferred_lang !== data.second_preferred_lang;
			}
			return true;
		},
		{
			message: 'First and second preferred languages cannot be the same',
		},
	);

export interface User extends z.infer<typeof userSchema> {
	role: UserRole;
}

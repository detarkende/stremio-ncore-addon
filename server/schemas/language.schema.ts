import { z } from 'zod';

export enum Language {
	EN = 'en',
	HU = 'hu',
}

export const languageSchema = z.nativeEnum(Language, {
	required_error: 'Language is required',
	message: `Invalid language value. Only the following values are allowed: ${Object.values(
		Language,
	).join(', ')}`,
});

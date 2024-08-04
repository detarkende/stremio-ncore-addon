import z from 'zod';
import cron from 'node-cron';
import { Language, Resolution } from '@ctrl/video-filename-parser';

const languageSchema = z.nativeEnum(Language, {
	required_error: 'Language is required',
	message: `Invalid language value. Only the following values are allowed: ${Object.values(
		Language,
	).join(', ')}`,
});
const resolutionSchema = z.nativeEnum(Resolution, {
	required_error: 'Resolution is required',
	message: `Invalid resolution value. Only the following values are allowed: ${Object.values(
		Resolution,
	).join(', ')}`,
});
export type PreferenceResolution = z.infer<typeof resolutionSchema>;

export const userSchema = z
	.object({
		username: z.string({ required_error: 'Username is required' }),
		password: z.string({ required_error: 'Password is required' }),
		first_preferred_lang: languageSchema,
		second_preferred_lang: languageSchema.optional(),
		preferred_resolutions: z.array(resolutionSchema),
	})
	.refine(
		(data) => {
			if ('second_preferred_lang' in data) {
				return data.first_preferred_lang !== data.second_preferred_lang;
			}
			return true;
		},
		{
			message: 'First and second preferred languages cannot be the same',
		},
	);

export enum UserRole {
	ADMIN = 'admin',
	USER = 'user',
}

export interface User extends z.infer<typeof userSchema> {
	role: UserRole;
}

export const configSchema = z
	.object({
		PORT: z.number({ coerce: true }).default(3000),
		APP_SECRET: z.string().min(10),
		ADDON_URL: z.string().url(),
		DOWNLOADS_DIR: z.string(),
		TORRENTS_DIR: z.string(),
		NCORE_URL: z.string().url().default('https://ncore.pro'),
		NCORE_USERNAME: z.string(),
		NCORE_PASSWORD: z.string(),
		DELETE_AFTER_HITNRUN: z.boolean({ coerce: true }).default(false),
		DELETE_AFTER_HITNRUN_CRON: z
			.string()
			.refine(cron.validate, { message: 'Invalid cron expression' })
			.default('0 2 * * *'),
		ADMIN_USERNAME: z.string(),
		ADMIN_PASSWORD: z.string(),
		ADMIN_FIRST_PREFERRED_LANGUAGE: languageSchema,
		ADMIN_SECOND_PREFERRED_LANGUAGE: languageSchema.optional(),
		ADMIN_PREFERRED_RESOLUTIONS: z
			.string()
			.transform((value) => value.split(','))
			.pipe(z.array(resolutionSchema)),
		USERS: z
			.string()
			.default('[]')
			.transform((str, ctx): unknown => {
				try {
					return JSON.parse(str);
				} catch (e) {
					ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
					return z.NEVER;
				}
			})
			.pipe(z.array(userSchema)),
	})
	.transform((config) => {
		return {
			...config,
			USERS: [
				...config.USERS.map((user) => ({ ...user, role: UserRole.USER })),
				{
					username: config.ADMIN_USERNAME,
					password: config.ADMIN_PASSWORD,
					role: UserRole.ADMIN,
					first_preferred_lang: config.ADMIN_FIRST_PREFERRED_LANGUAGE,
					second_preferred_lang: config.ADMIN_SECOND_PREFERRED_LANGUAGE,
					preferred_resolutions: config.ADMIN_PREFERRED_RESOLUTIONS,
				},
			] satisfies User[],
		};
	});

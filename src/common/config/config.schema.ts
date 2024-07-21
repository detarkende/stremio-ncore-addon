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

export const userSchema = z.object({
	username: z.string({ required_error: 'Username is required' }),
	password: z.string({ required_error: 'Password is required' }),
	role: z.enum(['user', 'admin'], {
		required_error: 'Role is required',
		message: 'Invalid value for user role. Only "user" and "admin" are allowed',
	}),
	preferences: z
		.object({
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
		),
});

export const configSchema = z.object({
	ncore: z.object({
		url: z
			.string()
			.url()
			.default('https://ncore.pro')
			.describe(
				`URL of the nCore website. This is only here in case the URL changes.\nOtherwise, you don't need to provide this.`,
			),
		username: z.string({ required_error: 'Ncore username is required.' }),
		password: z.string({ required_error: 'Ncore password is required.' }),
		delete_torrents_after_hitnrun: z
			.object({
				enabled: z
					.boolean()
					.default(false)
					.describe(
						'Enable automatic deletion of torrents that are not mandatory to seed anymore.',
					),
				cron: z
					.string()
					.refine(cron.validate, { message: 'Invalid cron expression' })
					.default('0 2 * * *')
					.describe(
						'Cron expression for running the hitnrun table check. Defaults to "Once every day at 2:00 AM"',
					),
			})
			.default({
				enabled: false,
				cron: '0 2 * * *',
			}),
	}),
	download_dir: z
		.string({ required_error: 'Download directory is required.' })
		.describe('Absolute path to the directory where the downloaded files will be saved.'),
	torrents_dir: z
		.string({ required_error: 'Torrents directory is required.' })
		.describe('Absolute path to the directory where the torrent files will be saved.'),
	port: z.number().default(3000).describe('Port number for the web server.'),
	addon_url: z
		.string()
		.url()
		.default('http://localhost:3000')
		.describe(
			'Full URL of the web server (with port number if necessary).\nThis needs to be accessible by the Stremio client.',
		),
	secret: z
		.string({ required_error: 'JWT secret is required for authentication.' })
		.min(16)
		.describe('Secret key for the JWT token.'),
	users: z
		.array(userSchema)
		.min(1, { message: 'At least one user is required' })
		.refine(
			(users) => {
				const usernames = users.map(({ username }) => username);
				// Check if there are any duplicate usernames
				return usernames.length === new Set(usernames).size;
			},
			{
				message: 'Usernames must be unique',
			},
		)
		.refine(
			(users) => {
				// Check if there is at least one admin user
				return users.findIndex(({ role }) => role === 'admin') !== -1;
			},
			{
				message: 'At least one admin user is required',
			},
		),
});

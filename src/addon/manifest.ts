import type { HonoRequest } from 'hono';
import type { Manifest } from 'stremio-addon-sdk';
import { config } from '@/common/config/config';
import { jwtToUser } from '@/common/helpers/user';

export const manifest = (req: HonoRequest): Manifest => {
	const baseUrl = getBaseUrl(req.url) || config.ADDON_URL;
	return {
		id: 'detarkende.ncore',
		behaviorHints: {
			adult: false,
			configurable: true,
			configurationRequired: true,
		},
		version: '0.0.1',
		name: 'nCore',
		description: 'Provides streams from a personal nCore account.',
		catalogs: [],
		resources: ['stream'],
		types: ['movie', 'series'],
		idPrefixes: ['tt'],
		logo: `${baseUrl}/assets/stremio-ncore-addon-logo-rounded.png`,
	};
};

export const authenticatedManifest = async (
	req: HonoRequest<'/auth/:jwt/manifest.json'>,
): Promise<Manifest> => {
	const regularManifest = manifest(req);
	const user = await jwtToUser(req.param('jwt'));
	return {
		...regularManifest,
		description: `Provides streams from a personal nCore account. Logged in as ${
			user!.username
		}`,
		behaviorHints: {
			...regularManifest.behaviorHints,
			configurationRequired: false,
			configurable: false,
		},
	};
};

const getBaseUrl = (urlString: string) => {
	const url = new URL(urlString);
	return url.origin;
};

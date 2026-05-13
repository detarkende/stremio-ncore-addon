import type { User } from 'src/types/user';

import type { CustomManifest } from './manifest.types';

export function getManifest({ user, addonUrl }: { user?: User; addonUrl: string }) {
  return {
    id: 'detarkende/stremio-ncore-addon',
    behaviorHints: {
      adult: false,
      configurable: !user,
      configurationRequired: !user,
    },
    baseUrl: addonUrl,
    version: '0.9.0',
    name: 'nCore',
    description: `Provides streams from a personal nCore account.${user ? `\nLogged in as ${user.username}.` : ''}`,
    catalogs: [],
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    logo: `${addonUrl}/stremio-ncore-addon-logo-rounded.png`,
  } satisfies CustomManifest;
}

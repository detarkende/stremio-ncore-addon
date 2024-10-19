import type { User } from '@/schemas/user.schema';
import { config } from '@/config';
import { CustomManifest } from './types';

export class ManifestService {
  public getBaseManifest() {
    return {
      id: 'detarkende.ncore',
      behaviorHints: {
        adult: false,
        configurable: true,
        configurationRequired: true,
      },
      baseUrl: config.ADDON_URL,
      version: '0.0.1',
      name: 'nCore',
      description: 'Provides streams from a personal nCore account.',
      catalogs: [],
      resources: ['stream'],
      types: ['movie', 'series'],
      idPrefixes: ['tt'],
      logo: `${config.ADDON_URL}/stremio-ncore-addon-logo-rounded.png`,
    } as const satisfies CustomManifest;
  }

  public getAuthenticatedManifest(user: User) {
    const baseManifest = this.getBaseManifest();
    return {
      ...baseManifest,
      description: `Provides streams from a personal nCore account. Logged in as ${user.username}`,
      behaviorHints: {
        ...baseManifest.behaviorHints,
        configurationRequired: false,
        configurable: false,
      },
    } as const satisfies CustomManifest;
  }
}

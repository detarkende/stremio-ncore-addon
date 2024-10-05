import type { Manifest } from 'stremio-addon-sdk';
import type { User } from '@/schemas/user.schema';
import { config } from '@/config';

export class ManifestService {
  public getBaseManifest(): Manifest {
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
      logo: `${config.ADDON_URL}/stremio-ncore-addon-logo-rounded.png`,
    };
  }

  public getAuthenticatedManifest(user: User): Manifest {
    const baseManifest = this.getBaseManifest();
    return {
      ...baseManifest,
      description: `Provides streams from a personal nCore account. Logged in as ${user.username}`,
      behaviorHints: {
        ...baseManifest.behaviorHints,
        configurationRequired: false,
        configurable: false,
      },
    };
  }
}

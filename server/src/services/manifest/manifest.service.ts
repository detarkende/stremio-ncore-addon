import { CustomManifest } from './types';
import { ConfigService } from '../config';
import { DeviceTokenService } from '../device-token';
import { UserService } from '../user';
import { Language } from '@/db/schema/users';
import { Genre } from '@/types/genre';
import { FlixPatrolPlatform } from '../catalog/constants';

export class ManifestService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private deviceTokenService: DeviceTokenService,
  ) {}

  public getBaseManifest() {
    const config = this.configService.getConfig();
    return {
      id: 'detarkende.ncore',
      behaviorHints: {
        adult: false,
        configurable: true,
        configurationRequired: true,
      },
      baseUrl: config.addonUrl,
      version: '0.0.1',
      name: 'nCore',
      description: 'Provides streams from a personal nCore account.',
      catalogs: [],
      resources: ['stream', 'catalog', 'meta'],
      types: ['movie', 'series'],
      idPrefixes: ['tt', 'ncore:'],
      logo: `${config.addonUrl}/stremio-ncore-addon-logo-rounded.png`,
    } as const;
  }

  public async getAuthenticatedManifest(deviceToken: string) {
    const [user, deviceTokenDetails] = await Promise.all([
      this.userService.getUserByDeviceTokenOrThrow(deviceToken),
      this.deviceTokenService.getDeviceTokenDetails(deviceToken),
    ]);
    const { preferredLanguage } = user;

    const baseManifest = this.getBaseManifest();
    return {
      ...baseManifest,
      description:
        preferredLanguage === Language.EN
          ? `Provides streams from a personal nCore account.\nLogged in as ${user.username}.\nDevice name: ${deviceTokenDetails.name}`
          : `Személyes nCore fiókból biztosít streameket.\nBejelentkezve mint ${user.username}.\nEszköz neve: ${deviceTokenDetails.name}`,
      behaviorHints: {
        ...baseManifest.behaviorHints,
        configurationRequired: false,
        configurable: false,
      },
      catalogs: [
        {
          type: 'movie',
          id: 'ncore.popular',
          name: 'nCore',
          pageSize: 25,
          extra: [
            { name: 'search' },
            { name: 'genre', options: Genre.getGenres(preferredLanguage) },
            { name: 'skip' },
          ],
          extraSupported: ['genre', 'skip', 'search'],
        },
        {
          type: 'series',
          id: 'ncore.popular',
          name: 'nCore',
          pageSize: 25,
          extra: [
            { name: 'search' },
            { name: 'genre', options: Genre.getGenres(preferredLanguage) },
            { name: 'skip' },
          ],
          extraSupported: ['genre', 'skip', 'search'],
        },
        {
          type: 'movie',
          id: `${FlixPatrolPlatform.NETFLIX}`,
          name: 'Netflix - Top 10',
          extra: [],
        },
        {
          type: 'series',
          id: `${FlixPatrolPlatform.NETFLIX}`,
          name: 'Netflix - Top 10',
          extra: [],
        },
        {
          type: 'movie',
          id: `${FlixPatrolPlatform.HBO}`,
          name: 'Max - Top 10',
          extra: [],
        },
        {
          type: 'series',
          id: `${FlixPatrolPlatform.HBO}`,
          name: 'Max - Top 10',
          extra: [],
        },
        {
          type: 'collections',
          id: `${FlixPatrolPlatform.DISNEY}`,
          name: 'Disney - Top 10',
          extra: [],
        },
        {
          type: 'movie',
          id: `${FlixPatrolPlatform.AMAZON}`,
          name: 'Amazon Prime - Top 10',
          extra: [],
        },
        {
          type: 'series',
          id: `${FlixPatrolPlatform.AMAZON}`,
          name: 'Amazon Prime - Top 10',
          extra: [],
        },
        {
          type: 'movie',
          id: `${FlixPatrolPlatform.APPLE}`,
          name: 'Apple TV - Top 10',
          extra: [],
        },
        {
          type: 'series',
          id: `${FlixPatrolPlatform.APPLE}`,
          name: 'Apple TV - Top 10',
          extra: [],
        },
        {
          type: 'collections',
          id: `${FlixPatrolPlatform.RTL}`,
          name: 'RTL+ - Top 10',
          extra: [],
        },
      ],
    } as const;
  }
}

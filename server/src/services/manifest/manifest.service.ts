import { ConfigService } from '../config';
import { DeviceTokenService } from '../device-token';
import { UserService } from '../user';
import { Language } from '@/db/schema/users';
import { Genre } from '@/types/genre';
import { Platform } from '@/services/catalog';

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
          pageSize: 75,
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
          pageSize: 75,
          extra: [
            { name: 'search' },
            { name: 'genre', options: Genre.getGenres(preferredLanguage) },
            { name: 'skip' },
          ],
          extraSupported: ['genre', 'skip', 'search'],
        },
        {
          type: 'movie',
          id: `${Platform.NETFLIX}`,
          name: 'Netflix',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'series',
          id: `${Platform.NETFLIX}`,
          name: 'Netflix',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'movie',
          id: `${Platform.HBO}`,
          name: 'Max',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'series',
          id: `${Platform.HBO}`,
          name: 'Max',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'movie',
          id: `${Platform.DISNEY}`,
          name: 'Disney+',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'series',
          id: `${Platform.DISNEY}`,
          name: 'Disney+',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'movie',
          id: `${Platform.AMAZONPRIME}`,
          name: 'Amazon Prime',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'series',
          id: `${Platform.AMAZONPRIME}`,
          name: 'Amazon Prime',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'movie',
          id: `${Platform.APPLETV}`,
          name: 'Apple TV',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'series',
          id: `${Platform.APPLETV}`,
          name: 'Apple TV',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'movie',
          id: `${Platform.SKYSHOWTIME}`,
          name: 'SkyShowtime',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'series',
          id: `${Platform.SKYSHOWTIME}`,
          name: 'SkyShowtime',
          pageSize: 10,
          extra: [{ name: 'skip' }],
        },
        {
          type: 'collections',
          id: `${Platform.RTL}`,
          name: 'RTL+ - Top 10',
          extra: [],
        },
      ],
    } as const;
  }
}

import { ConfigService } from '../config';
import { DeviceTokenService } from '../device-token';
import { UserService } from '../user';
import { Language } from '@/db/schema/users';
import { env } from '@/env';
import { getPlatforms } from '@/services/manifest/constants';
import { PlatformCatalog } from '@/services/catalog/types';

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
      resources: ['stream'],
      types: ['movie', 'series'],
      idPrefixes: ['tt'],
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
    const catalogs: PlatformCatalog[] = [];
    const platforms = getPlatforms(preferredLanguage);
    let resources = ['stream'];
    let idPrefixes = ['tt'];
    if (env.TMDB_API_KEY) {
      platforms.forEach((platform) => {
        platform.type.forEach((type) => {
          catalogs.push({
            type,
            id: platform.id,
            name: platform.name,
            pageSize: platform.pageSize,
            extra: platform.extra,
            extraSupported: platform.extraSupported,
          });
        });
      });
      resources = ['stream', 'catalog', 'meta'];
      idPrefixes = ['tt', 'ncore:'];
    }

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
      resources: resources,
      catalogs: catalogs,
      idPrefixes: idPrefixes,
    } as const;
  }
}

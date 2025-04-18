import type { ConfigService } from '../config';
import type { DeviceTokenService } from '../device-token';
import type { UserService } from '../user';
import type { CustomManifest } from './types';

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
      version: '0.8.0',
      name: 'nCore',
      description: 'Provides streams from a personal nCore account.',
      catalogs: [],
      resources: ['stream'],
      types: ['movie', 'series'],
      idPrefixes: ['tt'],
      logo: `${config.addonUrl}/stremio-ncore-addon-logo-rounded.png`,
    } as const satisfies CustomManifest;
  }

  public async getAuthenticatedManifest(deviceToken: string) {
    const [user, deviceTokenDetails] = await Promise.all([
      this.userService.getUserByDeviceTokenOrThrow(deviceToken),
      this.deviceTokenService.getDeviceTokenDetails(deviceToken),
    ]);
    const baseManifest = this.getBaseManifest();
    return {
      ...baseManifest,
      description: `Provides streams from a personal nCore account.\nLogged in as ${user.username}.\nDevice name: ${deviceTokenDetails.name}`,
      behaviorHints: {
        ...baseManifest.behaviorHints,
        configurationRequired: false,
        configurable: false,
      },
    } as const satisfies CustomManifest;
  }
}

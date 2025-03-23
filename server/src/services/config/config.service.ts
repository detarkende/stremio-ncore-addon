import { Database } from '@/db';
import { ConfigurationResponse, configurationTable } from '@/db/schema/configuration';
import { MissingConfigError } from './config.error';
import { CreateConfigRequest, UpdateConfigRequest } from '@/schemas/config.schema';
import { UserService } from '../user';
import { UserRole } from '@/db/schema/users';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from '@/types/http';
import { schedule, ScheduledTask } from 'node-cron';
import { TorrentStoreService } from '../torrent-store';
import { env } from '@/env';
import { getLocalIpUrl } from '@/utils/https';

export class ConfigService {
  constructor(
    private db: Database,
    private userService: UserService,
  ) {}

  public torrentStoreService: TorrentStoreService | null = null;

  public deleteAfterHitnrunCronTask: ScheduledTask | null = null;

  public scheduleDeleteAfterHitnrunCron() {
    const config = this.getConfigOrNull();
    if (!config) {
      console.log(
        'Missing config in config service. Cannot schedule deleteAfterHitnrun cron.',
      );
      return;
    }
    this.deleteAfterHitnrunCronTask?.stop();
    this.deleteAfterHitnrunCronTask = null;
    if (!this.torrentStoreService) {
      console.log('Missing torrent store service in config service.');
      return;
    }
    if (config.deleteAfterHitnrun) {
      this.deleteAfterHitnrunCronTask = schedule(
        config.deleteAfterHitnrunCron,
        this.torrentStoreService.deleteUnnecessaryTorrents,
      );
    }
  }

  public getAddonUrl(addonLocation: string, localOnly: boolean): string {
    if (localOnly) {
      return getLocalIpUrl(addonLocation, env.HTTPS_PORT);
    }
    return addonLocation;
  }

  public getConfig(): ConfigurationResponse {
    const config = this.db.select().from(configurationTable).limit(1).get();
    if (!config) {
      throw new MissingConfigError('No configuration found in the database.');
    }
    return {
      ...config,
      addonUrl: this.getAddonUrl(config.addonLocation, config.localOnly),
    };
  }

  public getConfigOrNull = (): ConfigurationResponse | null => {
    const config = this.db.select().from(configurationTable).limit(1).get();
    if (!config) {
      return null;
    }
    return {
      ...config,
      addonUrl: this.getAddonUrl(config.addonLocation, config.localOnly),
    };
  };

  public async createConfig(data: CreateConfigRequest): Promise<ConfigurationResponse> {
    const { addonLocation, deleteAfterHitnrun, admin, nonAdminUsers } = data;
    const config = await this.db.transaction(async (tx) => {
      const [config] = await tx
        .insert(configurationTable)
        .values({
          addonLocation: addonLocation.local ? '' : addonLocation.location,
          localOnly: addonLocation.local,
          deleteAfterHitnrun: deleteAfterHitnrun.enabled,
          deleteAfterHitnrunCron: deleteAfterHitnrun.cron || undefined,
        })
        .returning();

      console.log('Creating admin user...');
      await this.userService.createUser(admin, tx, UserRole.ADMIN);
      console.log('Creating non-admin users...');
      const nonAdminUsersPromises = nonAdminUsers.map((u) =>
        this.userService.createUser(u, tx, UserRole.USER),
      );
      await Promise.all(nonAdminUsersPromises);
      console.log('finished creating users');
      return config;
    });
    this.scheduleDeleteAfterHitnrunCron();
    return {
      ...config,
      addonUrl: this.getAddonUrl(config.addonLocation, config.localOnly),
    };
  }

  public async updateConfig(data: UpdateConfigRequest): Promise<ConfigurationResponse> {
    const { addonLocation, deleteAfterHitnrun } = data;
    console.log('Updating configuration:', data);
    try {
      const oldConfig = this.getConfig();
      const [newConfig] = await this.db
        .update(configurationTable)
        .set({
          addonLocation: addonLocation.location,
          localOnly: addonLocation.local,
          deleteAfterHitnrun: deleteAfterHitnrun.enabled,
          deleteAfterHitnrunCron: deleteAfterHitnrun.cron || undefined,
        })
        .returning();
      const deleteAfterHitnrunChanged =
        oldConfig.deleteAfterHitnrun !== newConfig.deleteAfterHitnrun ||
        oldConfig.deleteAfterHitnrunCron !== newConfig.deleteAfterHitnrunCron;
      if (deleteAfterHitnrunChanged) {
        this.scheduleDeleteAfterHitnrunCron();
      }
      return {
        ...newConfig,
        addonUrl: this.getAddonUrl(newConfig.addonLocation, newConfig.localOnly),
      };
    } catch (e) {
      throw new HTTPException(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        e instanceof Error
          ? e
          : { message: 'Unknown error occurred while updating configuration.' },
      );
    }
  }
}

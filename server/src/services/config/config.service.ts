import { HTTPException } from 'hono/http-exception';
import type { ScheduledTask } from 'node-cron';
import { schedule } from 'node-cron';
import type { UserService } from '../user';
import type { TorrentStoreService } from '../torrent-store';
import { MissingConfigError } from './config.error';
import type { Database } from '@/db';
import type { ConfigurationResponse } from '@/db/schema/configuration';
import { configurationTable } from '@/db/schema/configuration';
import type { CreateConfigRequest, UpdateConfigRequest } from '@/schemas/config.schema';
import { UserRole } from '@/db/schema/users';
import { HttpStatusCode } from '@/types/http';
import { env } from '@/env';
import { getLocalIpUrl } from '@/utils/https';
import { logger } from '@/logger';

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
      logger.info(
        'Missing config in config service. Cannot schedule deleteAfterHitnrun cron.',
      );
      return;
    }
    this.deleteAfterHitnrunCronTask?.stop();
    this.deleteAfterHitnrunCronTask = null;
    if (!this.torrentStoreService) {
      logger.info('Missing torrent store service in config service.');
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

      logger.info('Creating admin user...');
      await this.userService.createUser(admin, tx, UserRole.ADMIN);
      logger.info('Creating non-admin users...');
      const nonAdminUsersPromises = nonAdminUsers.map((u) =>
        this.userService.createUser(u, tx, UserRole.USER),
      );
      await Promise.all(nonAdminUsersPromises);
      logger.info('finished creating users');
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
    logger.info({ data }, 'Updating configuration:');
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

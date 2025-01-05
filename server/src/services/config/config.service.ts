import { Database } from '@/db';
import { Configuration, configurationTable } from '@/db/schema/configuration';
import { MissingConfigError } from './config.error';
import { CreateConfigRequest, UpdateConfigRequest } from '@/schemas/config.schema';
import { UserService } from '../user';
import { UserRole } from '@/db/schema/users';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from '@/types/http';
import { schedule, ScheduledTask } from 'node-cron';
import { TorrentStoreService } from '../torrent-store';

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

  public getConfig(): Configuration {
    const config = this.db.select().from(configurationTable).limit(1).get();
    if (!config) {
      throw new MissingConfigError('No configuration found in the database.');
    }
    return config;
  }

  public getConfigOrNull = (): Configuration | null => {
    return this.db.select().from(configurationTable).limit(1).get() ?? null;
  };

  public async createConfig(data: CreateConfigRequest): Promise<Configuration> {
    const { addonUrl, deleteAfterHitnrun, admin, nonAdminUsers } = data;
    const config = await this.db.transaction(async (tx) => {
      const [config] = await tx
        .insert(configurationTable)
        .values({
          addonUrl,
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
    return config;
  }

  public async updateConfig(data: UpdateConfigRequest): Promise<Configuration> {
    const { addonUrl, deleteAfterHitnrun } = data;
    console.log('Updating configuration:', data);
    try {
      const oldConfig = this.getConfig();
      const [newConfig] = await this.db
        .update(configurationTable)
        .set({
          addonUrl,
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
      return newConfig;
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

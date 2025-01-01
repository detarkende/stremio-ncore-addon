import { Database } from '@/db';
import { Configuration, configurationTable } from '@/db/schema/configuration';
import { MissingConfigError } from './config.error';
import { CreateConfigRequest, UpdateConfigRequest } from '@/schemas/config.schema';
import { UserService } from '../user';
import { UserRole } from '@/db/schema/users';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from '@/types/http';

export class ConfigService {
  constructor(
    private db: Database,
    private userService: UserService,
  ) {}

  public getConfig = (): Configuration => {
    const config = this.db.select().from(configurationTable).limit(1).get();
    if (!config) {
      throw new MissingConfigError('No configuration found in the database.');
    }
    return config;
  };

  public getConfigOrNull = (): Configuration | null => {
    return this.db.select().from(configurationTable).limit(1).get() ?? null;
  };

  public async createConfig(data: CreateConfigRequest): Promise<Configuration> {
    const {
      addonUrl,
      ncoreUsername,
      ncorePassword,
      deleteAfterHitnrun,
      admin,
      nonAdminUsers,
    } = data;
    return await this.db.transaction(async (tx) => {
      const [config] = await tx
        .insert(configurationTable)
        .values({
          addonUrl,
          ncoreUsername,
          ncorePassword,
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
  }

  public async updateConfig(data: UpdateConfigRequest): Promise<Configuration> {
    const { addonUrl, ncoreUsername, ncorePassword, deleteAfterHitnrun } = data;
    console.log('Updating configuration:', data);
    try {
      const [config] = await this.db
        .update(configurationTable)
        .set({
          addonUrl,
          ncoreUsername,
          ncorePassword,
          deleteAfterHitnrun: deleteAfterHitnrun.enabled,
          deleteAfterHitnrunCron: deleteAfterHitnrun.cron || undefined,
        })
        .returning();
      return config;
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

import { zValidator } from '@hono/zod-validator';
import { db } from '@server/db';
import { configurationTable } from '@server/db/schema/configuration';
import { usersTable } from '@server/db/schema/users';
import { logger } from '@server/logger';
import { createConfigSchema, updateConfigSchema } from '@server/schemas/config.schema';
import { HttpStatusCode } from '@server/types/http';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { useCookieAuth } from '../auth';
import { ncoreService } from '../ncore/index';
import { torrentClient } from '../torrent/index';
import { createUserRequestToInsertStatement } from '../user/user.utils';
import { useIsConfigured } from './config.middleware';
import { deleteOldTorrentsScheduler } from './config.schedule';
import { configRequestToInsertStatement, getConfig } from './config.utils';

export const configRoutes = new Hono()
  .basePath('/api')
  .get('/config/is-configured', (c) => {
    const config = getConfig();
    return c.json({ isConfigured: config !== null });
  })
  .get('/config', useCookieAuth(), (c) => {
    const config = getConfig();
    if (!config) {
      throw new HTTPException(HttpStatusCode.NOT_FOUND);
    }
    return c.json(config);
  })
  .post('/config', zValidator('json', createConfigSchema), async (c) => {
    const config = getConfig();
    if (config !== null) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: 'Config already exists.',
      });
    }
    const { admin, ...configRequest } = c.req.valid('json');
    const existingUsersWithUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, admin.username));
    if (existingUsersWithUsername.length > 0) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: 'Username is already taken.',
      });
    }
    try {
      db.transaction((tx) => {
        tx.insert(configurationTable)
          .values(configRequestToInsertStatement(configRequest))
          .run();
        tx.insert(usersTable)
          .values([createUserRequestToInsertStatement({ user: admin, isAdmin: true })])
          .run();
      });
      const config = getConfig();
      deleteOldTorrentsScheduler.schedule(
        config,
        torrentClient.deleteUnnecessaryTorrents.bind(torrentClient),
      );
    } catch (error) {
      logger.error(error, 'Failed to save configuration or create admin user');
      throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
        message: 'An error occurred during setup.',
      });
    }
    return c.json({ message: 'Setup completed successfully.' }, HttpStatusCode.CREATED);
  })
  .put(
    '/config',
    useCookieAuth('adminOnly'),
    useIsConfigured(HttpStatusCode.NOT_FOUND),
    zValidator('json', updateConfigSchema),
    async (c) => {
      const data = c.req.valid('json');
      try {
        await db
          .update(configurationTable)
          .set(configRequestToInsertStatement(data))
          .where(eq(configurationTable.id, 1))
          .returning();

        const updatedConfig = getConfig();
        deleteOldTorrentsScheduler.schedule(
          updatedConfig,
          torrentClient.deleteUnnecessaryTorrents.bind(torrentClient),
        );
        return c.json(updatedConfig);
      } catch (error) {
        logger.error(error, 'Failed to update configuration');
        throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
          message: 'An error occurred while updating configuration.',
        });
      }
    },
  )
  .get('/config/issues', useCookieAuth(), async (c) => {
    const isNcoreOk = await ncoreService.isNcoreAccessible();
    return c.json({
      isNcoreOk,
    });
  });

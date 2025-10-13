import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { UserRole, usersTable } from 'src/db/schema/users';
import { HttpStatusCode } from 'src/types/http';
import { createConfigSchema, updateConfigSchema } from 'src/schemas/config.schema';
import { db } from 'src/db';
import { configurationTable } from 'src/db/schema/configuration';
import { logger } from 'src/logger';
import { isNcoreAccessible } from '../ncore';
import { createUserRequestToInsertStatement } from '../user/user.utils';
import { useCookieAuth } from '../auth/auth.middleware';
import { deleteUnnecessaryTorrents } from '../torrent/torrent.utils';
import { useIsConfigured } from './config.middleware';
import {
  configRequestToInsertStatement,
  getConfig,
  scheduleHitnRunCron,
} from './config.utils';

export const configRoutes = new Hono()
  .basePath('/api')
  .get('/config/is-configured', (c) => {
    const config = getConfig();
    return c.json({ isConfigured: config !== null });
  })
  .get('/config', useCookieAuth(), (c) => {
    if (c.var.user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const config = getConfig();
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
      await db.transaction(async (tx) => {
        await tx
          .insert(configurationTable)
          .values(configRequestToInsertStatement(configRequest));
        await tx
          .insert(usersTable)
          .values([
            await createUserRequestToInsertStatement({ user: admin, isAdmin: true }),
          ]);
      });
      scheduleHitnRunCron(deleteUnnecessaryTorrents);
    } catch (error) {
      logger.error(error, 'Failed to save configuration or create admin user');
      throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
        message: 'An error occurred during setup.',
      });
    }
    return c.json({ message: 'Setup completed successfully.' });
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
    const isNcoreOk = await isNcoreAccessible();
    return c.json({
      isNcoreOk,
    });
  });

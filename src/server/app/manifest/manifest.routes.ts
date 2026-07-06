import { HttpStatusCode } from '@server/types/http';
import { getCurrentRequestUrl } from '@server/utils/url';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { useUrlTokenAuth } from '../auth/index';
import { getConfig } from '../config/config.utils';
import { useIsConfigured } from '../config/index';
import { getManifest } from './manifest.utils';

export const manifestRoutes = new Hono()
  .get('/manifest.json', (c) => {
    const config = getConfig();
    if (!config) {
      throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
        message: 'Server configuration missing',
      });
    }
    const manifest = getManifest({ addonUrl: getCurrentRequestUrl(c.req.url, config) });
    return c.json(manifest);
  })
  .get(
    '/api/auth/:token/manifest.json',
    useIsConfigured(),
    useUrlTokenAuth(),
    async (c) => {
      const { user, config } = c.var;
      const manifest = getManifest({
        addonUrl: getCurrentRequestUrl(c.req.url, config),
        user,
      });
      return c.json(manifest);
    },
  );

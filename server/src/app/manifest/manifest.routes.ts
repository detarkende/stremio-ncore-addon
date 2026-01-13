import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HttpStatusCode } from 'src/types/http';
import { getCurrentRequestUrl } from 'src/utils/url';
import { getConfig } from '../config/config.utils';
import { useUrlTokenAuth } from '../auth';
import { useIsConfigured } from '../config';
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

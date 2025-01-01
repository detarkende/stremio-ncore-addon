import { ConfigService } from '@/services/config';
import { MiddlewareHandler } from 'hono';

export const createIsConfiguredMiddleware =
  (configService: ConfigService): MiddlewareHandler =>
  async (c, next) => {
    const config = configService.getConfigOrNull();
    if (!config) {
      return c.redirect('/config');
    }
    return next();
  };

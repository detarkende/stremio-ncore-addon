import type { Context } from 'hono';
import type { ManifestService } from '@/services/manifest';
import type { HonoEnv } from '@/types/hono-env';

export class ManifestController {
  constructor(private manifestService: ManifestService) {}
  public async getBaseManifest(c: Context) {
    return c.json(this.manifestService.getBaseManifest());
  }

  public async getAuthenticatedManifest(c: Context<HonoEnv, '/:deviceToken'>) {
    const deviceToken = c.req.param('deviceToken');
    return c.json(await this.manifestService.getAuthenticatedManifest(deviceToken));
  }
}

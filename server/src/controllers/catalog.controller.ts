import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { UserService } from '@/services/user';
import { HttpStatusCode } from '@/types/http';
import { CatalogService } from '@/services/catalog/catalog.service';
import { platformCatalogQuerySchema } from '@/schemas/catalogs.schema';

export class CatalogController {
  constructor(
    private userService: UserService,
    private catalogService: CatalogService,
  ) {}

  public async getTop10ByPlatform(c: Context) {
    const params = c.req.param();
    const result = platformCatalogQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { type, deviceToken, platform } = result.data;

    const user = await this.userService.getUserByDeviceTokenOrThrow(deviceToken);
    const { preferredLanguage } = user;

    const date = new Date();
    date.setDate(date.getDate() - 1);
    const formattedDate = date.toISOString().split('T')[0];

    const results = await this.catalogService.getTop10ByPlatform(
      preferredLanguage,
      formattedDate,
      platform,
      type,
    );

    return c.json({ metas: results });
  }
}

import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { UserService } from '@/services/user';
import { HttpStatusCode } from '@/types/http';
import { CatalogService } from '@/services/catalog/catalog.service';
import { platformCatalogQuerySchema } from '@/schemas/catalogs.schema';
import { StreamType } from '@/schemas/stream.schema';

export class CatalogController {
  constructor(
    private userService: UserService,
    private catalogService: CatalogService,
  ) {}

  public async getRecommendedByPlatform(c: Context) {
    const params = c.req.param();
    const result = platformCatalogQuerySchema.safeParse(params);
    if (!result.success) {
      throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
        message: result.error.message,
      });
    }
    const { type, deviceToken, platform, values } = result.data;
    const parsedParams: Record<string, string> = {};

    if (values) {
      values.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key && value) parsedParams[key] = value.replace('.json', '');
      });
    }

    const skip = parsedParams['skip'] ? parseInt(parsedParams['skip'], 10) : undefined;

    const user = await this.userService.getUserByDeviceTokenOrThrow(deviceToken);
    const { preferredLanguage } = user;

    const results = await this.catalogService.getRecommendedByPlatform(
      preferredLanguage,
      platform,
      type as StreamType,
      skip,
    );

    return c.json({ metas: results });
  }
}

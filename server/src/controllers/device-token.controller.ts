import {
  CreateDeviceTokenInput,
  DeleteDeviceTokenInput,
} from '@/schemas/device-token.schema';
import { DeviceTokenService } from '@/services/device-token';
import { HonoEnv } from '@/types/hono-env';
import { HttpStatusCode } from '@/types/http';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class DeviceTokenController {
  constructor(private deviceTokenService: DeviceTokenService) {}

  async getDeviceTokensForUser(c: Context<HonoEnv>) {
    const { user } = c.var;
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const tokens = await this.deviceTokenService.getDeviceTokensForUser(user);
    return c.json(tokens);
  }

  public async createDeviceToken(
    c: Context<HonoEnv, string, { out: { json: CreateDeviceTokenInput } }>,
  ) {
    const { user } = c.var;
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const { name } = c.req.valid('json');
    const deviceToken = await this.deviceTokenService.createDeviceToken(user, name);
    return c.json(deviceToken);
  }

  public async deleteDeviceToken(
    c: Context<HonoEnv, string, { out: { json: DeleteDeviceTokenInput } }>,
  ) {
    const { user } = c.var;
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const { token } = c.req.valid('json');
    await this.deviceTokenService.deleteDeviceToken(user, token);
    return c.json({ success: true });
  }
}

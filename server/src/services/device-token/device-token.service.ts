import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db';
import { deviceTokensTable } from '@/db/schema/device-tokens';
import type { User } from '@/types/user';

export class DeviceTokenService {
  constructor(private db: Database) {}

  private generateDeviceToken(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
  }

  public async getDeviceTokensForUser(user: User) {
    const tokens = await this.db
      .select()
      .from(deviceTokensTable)
      .where(eq(deviceTokensTable.userId, user.id));
    return tokens;
  }

  public async getDeviceTokenDetails(token: string) {
    const [deviceToken] = await this.db
      .select()
      .from(deviceTokensTable)
      .where(eq(deviceTokensTable.token, token));
    return deviceToken;
  }

  public async createDeviceToken(user: User, name: string) {
    const token = this.generateDeviceToken();
    const [deviceToken] = await this.db
      .insert(deviceTokensTable)
      .values({ token, name, userId: user.id })
      .returning();
    return deviceToken;
  }

  public async deleteDeviceToken(user: User, token: string) {
    await this.db
      .delete(deviceTokensTable)
      .where(
        and(eq(deviceTokensTable.userId, user.id), eq(deviceTokensTable.token, token)),
      );
  }
}

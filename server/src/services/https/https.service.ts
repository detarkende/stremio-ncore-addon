import { env } from '@/env';
import { LocalIpResponse, localIpResponseSchema, ONE_HOUR } from './constants';
import { createSecureContext } from 'node:tls';
import { ServerOptions } from 'node:https';

export class HttpsService {
  constructor() {}

  private localIpDetails: LocalIpResponse | null = null;
  private localIpDetailsFetchedAt: number | null = null;

  public createServerOptions(): ServerOptions {
    return {
      SNICallback: async (serverName, cb) => {
        if (serverName.includes(env.LOCAL_IP_HOSTNAME)) {
          const localIpDetails = await this.fetchLocalIpKeys();
          if (!localIpDetails) {
            console.error('Local IP keys not available');
            return cb(Error('Local IP keys not available'));
          }
          const ctx = createSecureContext({
            key: localIpDetails.privkey,
            cert: `${localIpDetails.cert}\n${localIpDetails.chain}`,
          });
          return cb(null, ctx);
        }
      },
    };
  }

  private async fetchLocalIpKeys(): Promise<LocalIpResponse | null> {
    try {
      if (
        this.localIpDetails &&
        this.localIpDetailsFetchedAt &&
        Date.now() - this.localIpDetailsFetchedAt < ONE_HOUR
      ) {
        console.log('Using cached local-ip keys');
        return this.localIpDetails;
      }
      this.localIpDetailsFetchedAt = Date.now();
      console.log('Fetching local-ip keys');
      const req = await fetch(env.LOCAL_IP_KEYS_URL);
      const json = await req.json();
      const parseResult = localIpResponseSchema.safeParse(json);
      if (!parseResult.success) {
        console.error(`Failed to parse local IP keys: ${parseResult.error}`);
        return null;
      }
      console.log('Found local-ip keys');
      this.localIpDetails = parseResult.data;
      return parseResult.data;
    } catch (error) {
      console.error('Failed to fetch local IP keys:', this.formatError(error));
    }
    return null;
  }

  private formatError(error: unknown): string {
    if (error instanceof TypeError) {
      if ('hostname' in error) {
        return `Failed to fetch: ${error.hostname} ${error.message}`;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}

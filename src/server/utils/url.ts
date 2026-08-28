import type { ConfigurationResponse } from '@server/app/config/config.types';

export function getCurrentRequestUrl(url: string, config: ConfigurationResponse): string {
  const { remoteUrl, localUrl } = config;
  const currentUrl = new URL(url);
  if (remoteUrl && new URL(remoteUrl).host === currentUrl.host) {
    return remoteUrl;
  }
  return localUrl;
}

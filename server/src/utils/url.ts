import type { ConfigurationResponse } from 'src/db/schema/configuration';

export function getCurrentRequestUrl(url: string, config: ConfigurationResponse): string {
  const { remoteUrl, localUrl } = config;
  if (remoteUrl && url.startsWith(remoteUrl)) {
    return remoteUrl;
  }
  return localUrl;
}

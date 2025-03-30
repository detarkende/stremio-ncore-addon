import { env } from '@/env';

export const getLocalIpUrl = (ip: string, port: number) => {
  const ipSubdomain = ip.replace(/\./g, '-');
  return `https://${ipSubdomain}.${env.LOCAL_IP_HOSTNAME}${port === 443 ? '' : `:${port}`}`;
};

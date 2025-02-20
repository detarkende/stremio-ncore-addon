import { LOCAL_IP_HOSTNAME } from '@/constants/local-ip';

export const getLocalIpUrl = (ip: string, port: number) => {
  const ipSubdomain = ip.replace(/\./g, '-');
  return `https://${ipSubdomain}.${LOCAL_IP_HOSTNAME}${port === 443 ? '' : `:${port}`}`;
};

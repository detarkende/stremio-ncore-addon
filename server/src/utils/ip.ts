import os from 'node:os';

export const getLocalNetworkIp = (): string => {
  const ipAddresses = Object.values(os.networkInterfaces()).flat();
  const lanIp = ipAddresses.find(
    (ip) => ip && ip.family === 'IPv4' && !ip.internal,
  )?.address;
  if (lanIp) {
    return lanIp;
  }
  return (
    ipAddresses.find(
      (ip) => ip && ip.family === 'IPv4' && ip.address.startsWith('192.168'),
    )?.address ?? ''
  );
};

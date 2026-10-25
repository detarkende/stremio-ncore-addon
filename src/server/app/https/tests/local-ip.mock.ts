import { env } from '@server/env';
import selfsigned from 'selfsigned';

import type { LocalIpResponse } from '../https.constants';

async function generateMockLocalIpMocks(): Promise<{
  caCertificate: string;
  response: LocalIpResponse;
}> {
  const hostname = `*.${env.LOCAL_IP_HOSTNAME}`;
  const ca = await selfsigned.generate(
    [{ name: 'commonName', value: 'local-ip test CA' }],
    {
      algorithm: 'sha256',
      keySize: 2048,
      extensions: [
        {
          name: 'basicConstraints',
          cA: true,
        },
        {
          name: 'keyUsage',
          keyCertSign: true,
          cRLSign: true,
        },
      ],
    },
  );
  const leaf = await selfsigned.generate([{ name: 'commonName', value: hostname }], {
    algorithm: 'sha256',
    keySize: 2048,
    ca: {
      key: ca.private,
      cert: ca.cert,
    },
    extensions: [
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
      },
      {
        name: 'subjectAltName',
        altNames: [{ type: 2, value: hostname }],
      },
    ],
  });

  return {
    caCertificate: ca.cert,
    response: {
      privkey: leaf.private,
      cert: leaf.cert,
      chain: ca.cert,
      fullchain: `${leaf.cert}${ca.cert}`,
    },
  };
}

const mockLocalIpMocks = await generateMockLocalIpMocks();

export const mockLocalIpCaCertificate = mockLocalIpMocks.caCertificate;
export const mockLocalIpResponse = mockLocalIpMocks.response;

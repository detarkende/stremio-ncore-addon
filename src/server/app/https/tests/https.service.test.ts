import https from 'node:https';
import type { AddressInfo } from 'node:net';
import * as tls from 'node:tls';

import { serve } from '@hono/node-server';
import { env } from '@server/env';
import { logger } from '@server/logger';
import { fetchMock } from '@server/test-utils/fetch-mock';
import { Hono } from 'hono';

import { HttpsService } from '../https.service';
import { mockLocalIpCaCertificate, mockLocalIpResponse } from './local-ip.mock';

vi.mock('node:tls', { spy: true });

function requestLocalServer(url: string): Promise<{ status: number }> {
  return new Promise((resolve, reject) => {
    const client = https.request(url, { ca: mockLocalIpCaCertificate }, (response) => {
      response.resume();
      response.once('error', reject);
      response.once('end', () => resolve({ status: response.statusCode ?? 0 }));
    });
    client.once('error', reject);
    client.end();
  });
}

describe('HttpsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  const createSecureContextSpy = vi.mocked(tls.createSecureContext);

  it('should fetch the data from the local-ip server and use it to create a secure context', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(mockLocalIpResponse));

    const app = new Hono().get('/', (c) => c.text('Hello, world!'));
    const serverOptions = new HttpsService().createServerOptions();

    const server = serve({
      fetch: app.fetch,
      createServer: https.createServer,
      serverOptions,
      port: 0,
    });
    const address = server.address() as AddressInfo;
    const url = `https://127-0-0-1.${env.LOCAL_IP_HOSTNAME}:${address.port}`;

    const response = await requestLocalServer(url);
    expect(response.status).toBe(200);
    expect(createSecureContextSpy).toHaveBeenCalledWith({
      key: mockLocalIpResponse.privkey,
      cert: `${mockLocalIpResponse.cert}\n${mockLocalIpResponse.chain}`,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(env.LOCAL_IP_KEYS_URL);

    server.close();
  });

  it('should use cached keys for subsequent matching hostnames', async () => {
    fetchMock.mockResolvedValueOnce(Response.json(mockLocalIpResponse));

    const app = new Hono().get('/', (c) => c.text('Hello, world!'));
    const serverOptions = new HttpsService().createServerOptions();

    const server = serve({
      fetch: app.fetch,
      createServer: https.createServer,
      serverOptions,
      port: 0,
    });
    const address = server.address() as AddressInfo;
    const url = `https://127-0-0-1.${env.LOCAL_IP_HOSTNAME}:${address.port}`;

    const response = await requestLocalServer(url);
    expect(response.status).toBe(200);
    const response2 = await requestLocalServer(url);
    expect(response2.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(env.LOCAL_IP_KEYS_URL);

    server.close();
  });

  it('should report an error when local keys are invalid', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ invalid: 'true' }));

    const app = new Hono().get('/', (c) => c.text('Hello, world!'));
    const serverOptions = new HttpsService().createServerOptions();

    const server = serve({
      fetch: app.fetch,
      createServer: https.createServer,
      serverOptions,
      port: 0,
    });
    const address = server.address() as AddressInfo;
    const url = `https://127-0-0-1.${env.LOCAL_IP_HOSTNAME}:${address.port}`;

    await expect(requestLocalServer(url)).rejects.toThrow();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      'Failed to parse local IP keys',
      expect.objectContaining({
        error: expect.any(Object),
      }),
    );
    server.close();
  });

  it('should report an error when fetching local keys fails', async () => {
    fetchMock.mockRejectedValue(new Error('network failure'));
    const app = new Hono().get('/', (c) => c.text('Hello, world!'));
    const serverOptions = new HttpsService().createServerOptions();

    const server = serve({
      fetch: app.fetch,
      createServer: https.createServer,
      serverOptions,
      port: 0,
    });
    const address = server.address() as AddressInfo;
    const url = `https://127-0-0-1.${env.LOCAL_IP_HOSTNAME}:${address.port}`;

    await expect(requestLocalServer(url)).rejects.toThrow();
    expect(vi.mocked(logger).error).toHaveBeenCalledWith(
      'Failed to fetch local IP keys:',
      expect.objectContaining({
        error: 'network failure',
      }),
    );
    expect(vi.mocked(logger).error).toHaveBeenCalledWith('Local IP keys not available');
    server.close();
  });

  it('should ignore unrelated hostnames', async () => {
    const callback = vi.fn();

    new HttpsService().createServerOptions().SNICallback?.('example.com', callback);

    expect(callback).not.toHaveBeenCalled();
  });
});

import { Hono } from 'hono';
import { db } from 'src/db';
import { configurationTable } from '../../../db/schema/configuration';
import { useIsConfigured } from '../config.middleware';

describe('Config Middleware', () => {
  describe('useIsConfigured', () => {
    it('should throw a 500 error if configuration is missing', async () => {
      const app = new Hono().get('/', useIsConfigured(), (c) => c.json({ ok: true }));

      const response = await app.request('/');

      expect(response.status).toBe(500);
    });

    it('should return a custom status code if configuration is missing and custom status code is provided', async () => {
      const app = new Hono().get('/', useIsConfigured(404), (c) => c.json({ ok: true }));

      const response = await app.request('/');

      expect(response.status).toBe(404);
    });

    it('should allow the request to proceed if configuration exists', async () => {
      await db.insert(configurationTable).values([
        {
          id: 1,
          localIp: '192.168.1.15',
          remoteUrl: null,
          deleteAfterHitnrun: false,
        },
      ]);
      const app = new Hono().get('/', useIsConfigured(), (c) => c.json({ ok: true }));

      const response = await app.request('/');

      expect(response.status).toBe(200);
    });
  });
});

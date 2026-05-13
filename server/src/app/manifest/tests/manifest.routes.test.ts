import { testClient } from 'hono/testing';
import { configureApp } from 'src/test-utils/config';
import { createTestUser } from 'src/test-utils/users';

import { manifestRoutes } from '../manifest.routes';

describe('Manifest routes', () => {
  const client = testClient(manifestRoutes);

  describe('GET /manifest.json', () => {
    it('should return 500 if server configuration is missing', async () => {
      const response = await client['manifest.json'].$get();
      expect(response.status).toBe(500);
      const error = await response.text();
      expect(error).toBe('Server configuration missing');
    });
    it('should return generic manifest', async () => {
      configureApp();
      const response = await client['manifest.json'].$get();
      expect(response.status).toBe(200);
      const manifest = await response.json();
      expect(manifest).toHaveProperty('id', 'detarkende/stremio-ncore-addon');
      expect(manifest).toHaveProperty(
        'description',
        'Provides streams from a personal nCore account.',
      );
      expect(manifest).toHaveProperty('behaviorHints.configurable', true);
      expect(manifest).toHaveProperty('behaviorHints.configurationRequired', true);
      expect(manifest).toHaveProperty('resources', ['stream']);
      expect(manifest).toHaveProperty('types', ['movie', 'series']);
    });
  });

  describe('GET /api/auth/:token/manifest.json', () => {
    it('should return authenticated manifest for authenticated user', async () => {
      configureApp();
      const user = await createTestUser();
      const response = await client.api.auth[':token']['manifest.json'].$get({
        param: { token: user.token },
      });
      expect(response.status).toBe(200);
      const manifest = await response.json();
      expect(manifest).toHaveProperty('id', 'detarkende/stremio-ncore-addon');
      expect(manifest).toHaveProperty('description');
      expect(manifest.description).toContain(`Logged in as ${user.username}.`);
      expect(manifest).toHaveProperty('behaviorHints.configurable', false);
      expect(manifest).toHaveProperty('behaviorHints.configurationRequired', false);
      expect(manifest).toHaveProperty('resources', ['stream']);
      expect(manifest).toHaveProperty('types', ['movie', 'series']);
    });
  });
});

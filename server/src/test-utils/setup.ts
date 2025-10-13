import { afterEach, beforeEach } from 'vitest';
import { loadEnv } from 'src/env';
import { createDbInstance } from 'src/db/client';
import mockFs from 'mock-fs';

function setupTestEnv() {
  loadEnv({
    NODE_ENV: 'test',
    ADDON_DIR: '/addon_dir',
    NCORE_USERNAME: 'username',
    NCORE_PASSWORD: 'password',
  });
  createDbInstance({ isTestDb: true });
}
setupTestEnv();

beforeEach(() => {
  setupTestEnv();
});

afterEach(() => {
  mockFs.restore();
});

import { createDbInstance } from '@server/db/client';
import { loadEnv } from '@server/env';
import { logger, logLevels } from '@server/logger';
import mockFs from 'mock-fs';

function setupTestEnv() {
  for (const level of logLevels) {
    vi.spyOn(logger, level);
  }
  loadEnv({
    NODE_ENV: 'test',
    ADDON_DIR: '/addon_dir',
    NCORE_USERNAME: 'username',
    NCORE_PASSWORD: 'password',
    TORRENT_PORT: '0',
  });
  createDbInstance({ isTestDb: true });
}
setupTestEnv();

beforeEach(() => {
  setupTestEnv();
});

afterEach(() => {
  mockFs.restore();
  vi.resetAllMocks();
});

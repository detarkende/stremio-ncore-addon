import { createDbInstance } from '@server/db/client';
import { loadEnv } from '@server/env';
import { logger, logLevels } from '@server/logger';
import mockFs from 'mock-fs';

vi.mock('undici', async (importActual) => {
  // oxlint-disable-next-line typescript/consistent-type-imports
  const actual = await importActual<typeof import('undici')>();

  return {
    ...actual,
    fetch: vi.fn(),
  };
});

function setupTestEnv() {
  for (const level of logLevels) {
    vi.spyOn(logger, level).mockImplementation(() => {});
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

import { deleteOldTorrentsScheduler } from './app/config/config.schedule';
import { torrentClient } from './app/torrent';
import { closeDbInstance } from './db/client';
import { registerGracefulShutdown } from './shutdown';

describe('graceful shutdown', () => {
  const createServer = () => ({
    close: vi.fn((callback: (error?: Error) => void) => callback()),
    closeIdleConnections: vi.fn(),
    closeAllConnections: vi.fn(),
  });

  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(deleteOldTorrentsScheduler, 'destroy').mockImplementation(() => undefined);
    vi.spyOn(torrentClient, 'destroy').mockResolvedValue(undefined);
    vi.spyOn({ closeDbInstance }, 'closeDbInstance');
  });

  afterEach(() => {
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'] as const) {
      process.removeAllListeners(signal);
    }
    vi.restoreAllMocks();
  });

  it('should close servers and background work before exiting successfully', async () => {
    const http = createServer();
    const https = createServer();

    registerGracefulShutdown({ http, https });
    process.emit('SIGTERM');
    await new Promise((resolve) => setImmediate(resolve));

    expect(http.close).toHaveBeenCalledOnce();
    expect(https.close).toHaveBeenCalledOnce();
    expect(deleteOldTorrentsScheduler.destroy).toHaveBeenCalledOnce();
    expect(torrentClient.destroy).toHaveBeenCalledOnce();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should exit with failure when background cleanup fails', async () => {
    const http = createServer();
    const https = createServer();
    vi.mocked(torrentClient.destroy).mockRejectedValueOnce(new Error('destroy failed'));

    registerGracefulShutdown({ http, https });
    process.emit('SIGINT');
    await new Promise((resolve) => setImmediate(resolve));

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(http.close).toHaveBeenCalledOnce();
    expect(https.close).toHaveBeenCalledOnce();
  });
});

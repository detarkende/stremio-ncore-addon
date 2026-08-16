import { Hono } from 'hono';

import { requestLogger } from './logger';
import { requestLoggerMiddleware } from './request-logger.middleware';

describe('requestLoggerMiddleware', () => {
  it('should log request details after the handler completes', async () => {
    const info = vi.spyOn(requestLogger, 'info');
    const app = new Hono();
    app.use('*', requestLoggerMiddleware);
    app.get('/', (c) => c.text('ok'));

    await expect(app.request('http://localhost/')).resolves.toHaveProperty('status', 200);

    expect(info).toHaveBeenCalledWith(
      'Request',
      expect.objectContaining({
        method: 'GET',
        status: 200,
        user: null,
      }),
    );
  });
});

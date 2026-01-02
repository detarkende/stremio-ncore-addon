import { testClient } from 'hono/testing';
import nock from 'nock';
import { env } from 'src/env';
import { configureApp } from 'src/test-utils/config';
import { streamRoutes } from '../stream.routes';
import { StreamType } from '../stream.constants';

describe('Stream routes', () => {
  const client = testClient(streamRoutes);

  nock(env.NCORE_URL)
    .post('/login.php')
    .reply(
      200,
      {},
      {
        'Set-Cookie': `pass=valid_cookie_value; Path=/; HttpOnly; Expires=${new Date(Date.now() + 60 * 60 * 1000).toUTCString()}`,
      },
    );

  describe('GET /auth/:token/stream/:type/:imdbId', () => {
    beforeEach(() => {
      configureApp();
    });
    it('should return 401 for invalid token', async () => {
      const response = await client.api.auth[':token'].stream[':type'][':imdbId'].$get({
        param: { type: StreamType.MOVIE, imdbId: 'tt1234567', token: 'invalidToken' },
      });
      expect(response.status).toBe(401);
    });
  });
});

import path from 'node:path';

import { env } from '@server/env';
import { Agent, interceptors, cacheStores, type Dispatcher } from 'undici';
import type Interceptors from 'undici/types/interceptors';

import { ensureDirExists } from './files';

if (env.NODE_ENV !== 'test') {
  ensureDirExists(env.HTTP_CACHE_DIR);
}
const cacheDbPath =
  env.NODE_ENV === 'test'
    ? ':memory:' // Use in-memory database for testing
    : path.resolve(env.HTTP_CACHE_DIR, 'http-cache.db');

let cacheStore = new cacheStores.SqliteCacheStore({ location: cacheDbPath });

export function createCacheAgent(
  opts: Omit<Interceptors.CacheInterceptorOpts, 'store'> = {},
  retryOptions?: Interceptors.RetryInterceptorOpts,
): Dispatcher.ComposedDispatcher {
  const agent = new Agent().compose(
    ...(retryOptions ? [interceptors.retry(retryOptions)] : []),
    // The last interceptor runs first, so retries happen on cache misses.
    interceptors.cache({ ...opts, store: cacheStore }),
  );

  return agent;
}

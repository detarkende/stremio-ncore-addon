import { LRUCache } from 'lru-cache';

/** 15 minutes */
export const DEFAULT_TTL = 1000 * 60 * 15;
export const DEFAULT_MAX = 100;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type CacheOptions<ReturnedT extends {}, Args extends unknown[]> = LRUCache.Options<
  string,
  ReturnedT,
  unknown
> & {
  generateKey: (...args: Args) => string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function cacheFunction<ReturnedT extends {}, Args extends unknown[]>(
  { generateKey, ...options }: CacheOptions<ReturnedT, Args>,
  originalFunction: (...args: Args) => Promise<ReturnedT>,
) {
  const cache = new LRUCache<string, ReturnedT, unknown>(options);
  return async function (...args: Args): Promise<ReturnedT> {
    const key = generateKey(...args);
    const cachedValue = cache.get(key);
    if (cachedValue) {
      return cachedValue;
    }
    const result = await originalFunction(...args);
    cache.set(key, result);
    return result;
  };
}

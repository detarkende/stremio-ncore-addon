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
export function Cached<ReturnedT extends {}, Args extends unknown[]>({
  generateKey,
  ...options
}: CacheOptions<ReturnedT, Args>) {
  const cache = new LRUCache<string, ReturnedT, unknown>(options);
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: Args) => Promise<ReturnedT>>,
  ) {
    const originalMethod = descriptor.value!;
    descriptor.value = async function (...args) {
      const key = generateKey(...args);
      const cachedValue = cache.get(key);
      if (cachedValue) {
        return cachedValue;
      }
      const result = await originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };
  };
}

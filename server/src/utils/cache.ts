import { Cache, CacheContainer, ICachingOptions } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';

const defaultOptions: Partial<ICachingOptions> = {
  ttl: 60 * 15, // 15 minutes
  isLazy: false,
};

export const createCache = () => {
  const cacheStorage = new MemoryStorage();
  const cache = new CacheContainer(cacheStorage);
  return (options: Partial<ICachingOptions> = {}) => {
    return Cache(cache, { ...defaultOptions, ...options });
  };
};

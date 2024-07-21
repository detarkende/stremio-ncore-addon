import hashSum from 'hash-sum';

class Cache<TValue> {
	private maxCacheSize: number;
	private cacheTime: number;
	private cache: Map<string, { lastAccessedAt: number; value: TValue }>;

	constructor({ cacheTime, maxCacheSize }: { maxCacheSize: number; cacheTime: number }) {
		this.maxCacheSize = maxCacheSize;
		this.cacheTime = cacheTime;
		this.cache = new Map();
	}

	get(key: string) {
		const currentTime = Date.now();
		const item = this.cache.get(key);
		if (item !== undefined) {
			// refresh key
			this.cache.delete(key);
			this.cache.set(key, { lastAccessedAt: currentTime, value: item.value });
		}
		if (item) {
			if (item.lastAccessedAt > currentTime - this.cacheTime) {
				return item.value;
			}
			this.cache.delete(key);
		}
	}

	set(key: string, val: TValue) {
		// refresh key
		if (this.cache.has(key)) this.cache.delete(key);
		// evict oldest
		else if (this.cache.size === this.maxCacheSize) this.cache.delete(this.getCacheFirstKey());
		this.cache.set(key, { lastAccessedAt: Date.now(), value: val });
	}

	getCacheFirstKey() {
		return this.cache.keys().next().value;
	}
}

export const memoize = <T extends (...args: Parameters<T>) => ReturnType<T>>({
	fn,
	cacheTime = Infinity,
	maxCacheSize = 1000,
}: {
	fn: T;
	cacheTime?: number;
	maxCacheSize?: number;
}) => {
	const cache = new Cache<ReturnType<T>>({ maxCacheSize, cacheTime });
	return (...args: Parameters<T>): ReturnType<T> => {
		const key = hashSum(args);
		const cached = cache.get(key);

		if (cached) {
			return cached;
		}
		const result = fn(...args);
		cache.set(key, result);
		return result;
	};
};

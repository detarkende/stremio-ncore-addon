import { cacheFunction, DEFAULT_MAX, DEFAULT_TTL } from './cache';

describe('cacheFunction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('caches the result of the original function', async () => {
    const original = vi.fn(async (num: number) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return num * 2;
    });
    const cached = cacheFunction(
      {
        generateKey: (num: number) => num.toString(),
        ttl: DEFAULT_TTL,
        max: DEFAULT_MAX,
      },
      original,
    );

    const firstCall = cached(2);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(firstCall).resolves.toBe(4);

    await expect(cached(2)).resolves.toBe(4);
    expect(original).toHaveBeenCalledTimes(1);
  });

  it('evicts least recently used entries when max size is reached', async () => {
    const original = vi.fn(async (num: number) => num);
    const cached = cacheFunction(
      {
        generateKey: (num: number) => num.toString(),
        ttl: DEFAULT_TTL,
        max: 1,
      },
      original,
    );

    await expect(cached(1)).resolves.toBe(1);
    await expect(cached(2)).resolves.toBe(2);
    await expect(cached(1)).resolves.toBe(1);
    expect(original).toHaveBeenCalledTimes(3);
  });
});

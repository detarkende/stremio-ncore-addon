import { batchAsyncFunctions } from './process-in-batches';

describe('batchAsyncFunctions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should process functions in batches with delay', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    const functions = Array(5).fill(() => mockFn());

    const promises = batchAsyncFunctions({
      functions,
      batchSize: 2,
      delayMs: 1000,
    });

    expect(mockFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(0);
    expect(mockFn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFn).toHaveBeenCalledTimes(5);

    const results = await Promise.all(promises);
    expect(results).toEqual(['result', 'result', 'result', 'result', 'result']);
  });

  it('should handle empty array of functions', async () => {
    const promises = batchAsyncFunctions({
      functions: [],
      batchSize: 2,
      delayMs: 1000,
    });

    expect(promises).toEqual([]);
  });
});

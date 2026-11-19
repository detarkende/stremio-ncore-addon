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

  it('should wait for all functions in a batch to settle before starting the delay', async () => {
    const pending = Promise.withResolvers<string>();
    const first = vi.fn(() => pending.promise);
    const second = vi.fn().mockResolvedValue('second');
    const third = vi.fn().mockResolvedValue('third');

    const promises = batchAsyncFunctions({
      functions: [first, second, third],
      batchSize: 2,
      delayMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(5000);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(third).not.toHaveBeenCalled();

    pending.resolve('first');
    await vi.advanceTimersByTimeAsync(999);
    expect(third).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(third).toHaveBeenCalledOnce();
    await expect(Promise.all(promises)).resolves.toEqual(['first', 'second', 'third']);
  });

  it('should continue after failures and preserve each result', async () => {
    const syncError = new Error('synchronous failure');
    const asyncError = new Error('asynchronous failure');
    const nextBatch = vi.fn().mockResolvedValue('success');

    const promises = batchAsyncFunctions({
      functions: [
        () => {
          throw syncError;
        },
        () => Promise.reject(asyncError),
        nextBatch,
      ],
      batchSize: 2,
      delayMs: 1000,
    });
    const results = Promise.allSettled(promises);

    await vi.advanceTimersByTimeAsync(999);
    expect(nextBatch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(nextBatch).toHaveBeenCalledOnce();
    await expect(results).resolves.toEqual([
      { status: 'rejected', reason: syncError },
      { status: 'rejected', reason: asyncError },
      { status: 'fulfilled', value: 'success' },
    ]);
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

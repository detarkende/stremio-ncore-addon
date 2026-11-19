const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Takes an array of functions that return promises and returns an array of the same size,
 * where each batch starts after the previous batch settles and the delay has elapsed.
 */
export function batchAsyncFunctions<R>({
  functions,
  batchSize,
  delayMs,
}: {
  batchSize: number;
  delayMs: number;
  functions: (() => Promise<R>)[];
}): Promise<R>[] {
  const result: Promise<R>[] = [];
  const batches = chunkArray(functions, batchSize);
  let previousBatchFinished: Promise<void> = Promise.resolve();

  batches.forEach((batch, index) => {
    const batchStart =
      index === 0
        ? previousBatchFinished
        : previousBatchFinished.then(() => delay(delayMs));
    const batchPromises = batch.map((fn) => batchStart.then(fn));

    result.push(...batchPromises);
    previousBatchFinished = Promise.allSettled(batchPromises).then(() => {});
  });

  return result;
}

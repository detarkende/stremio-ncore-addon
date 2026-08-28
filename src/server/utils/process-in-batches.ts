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
 * where the functions are executed in batches with a delay between each batch.
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
  batches.forEach((batch, index) => {
    const previousBatch = batches[index - 1];
    const previousBatchFinisedPromise = previousBatch
      ? Promise.allSettled(previousBatch)
      : Promise.resolve();
    const delayedFunctions = batch.map(
      (fn) =>
        new Promise<R>((resolve, reject) => {
          previousBatchFinisedPromise.then(() =>
            delay(delayMs * index).then(() => fn().then(resolve).catch(reject)),
          );
        }),
    );
    result.push(...delayedFunctions);
  });

  return result;
}

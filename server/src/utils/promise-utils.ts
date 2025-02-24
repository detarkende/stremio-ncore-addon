export async function awaitAllReachablePromises<T>(promises: Promise<T>[]): Promise<T[]> {
  const awaitedResults: PromiseSettledResult<T>[] = await Promise.allSettled(promises);
  const successfulResults: PromiseFulfilledResult<T>[] = awaitedResults.filter(
    (promise): promise is PromiseFulfilledResult<T> => promise.status === 'fulfilled',
  );
  const failedResults: PromiseRejectedResult[] = awaitedResults.filter(
    (promise): promise is PromiseRejectedResult => promise.status === 'rejected',
  );
  failedResults.forEach(({ reason }) =>
    console.error(reason ?? 'Unknown error occurred.'),
  );
  return successfulResults.map(({ value }) => value);
}

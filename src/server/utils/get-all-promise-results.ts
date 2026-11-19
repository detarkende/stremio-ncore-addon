/**
 * @example
 * ```ts
 * const [results, errors] = await getAllPromiseResults([
 *   Promise.resolve(1),
 *   Promise.reject(new Error('fail'))
 * ]);
 * console.log(results); // [1]
 * console.log(errors); // [Error: fail]
 * ```
 *
 * @param promises Array of promises to resolve
 * @returns A tuple where the first element is an array of resolved values and the second element is an array of errors
 */
export async function getAllPromiseResults<T, TExpectedError = unknown>(
  promises: Promise<T>[],
): Promise<[T[], TExpectedError[]]> {
  const results = await Promise.allSettled(promises);
  const successResults: T[] = [];
  const failureResults: TExpectedError[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successResults.push(result.value);
    } else {
      failureResults.push(result.reason);
    }
  }
  return [successResults, failureResults];
}

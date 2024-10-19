/**
 *
 * @param array The array of items that needs to be rated
 * @param rateFns A function that returns a number based on information from each item
 * @param topN The number of items that will be returned
 * @returns The top rated items
 */
export const rateList = <T>(
  array: T[],
  rateFns: ((item: T, index: number) => number)[],
  topN: number = array.length,
): T[] => {
  const rates = array.map((item, index) => {
    return {
      item,
      rating: rateFns.reduce((acc, rateFn) => acc + rateFn(item, index), 0),
    };
  });
  rates.sort((a, z) => z.rating - a.rating);
  return rates.map(({ item }) => item).slice(0, topN);
};

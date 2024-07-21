/**
 * Filters an array with a list of filter functions.
 *
 * The first filter function that returns a non-empty array will be used.
 *
 * If all filter functions return an empty array, the `lastResort` will be returned.
 * (If it isn't defined, the original array will be returned.)
 * @param array The array that needs to be filtered
 * @param filterFns Filter functions that will be applied in order
 * @param lastResort If defined and all the filter functions return an empty array, this will be returned
 * @returns filtered array
 */
export const narrowList = <T>(
	array: T[],
	filterFns: ((item: T, index: number) => boolean)[],
	lastResort?: T[],
): T[] => {
	for (const filterFn of filterFns) {
		const filteredArray = array.filter(filterFn);
		if (filteredArray.length > 0) {
			return filteredArray;
		}
	}
	return lastResort ?? array;
};

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

/**
 * Returns 0 if the number is outside the range, 1 if it's in the middle, and a number between 0 and 1 if it's in between
 * @param x The number that we want to know the "optimalness" of
 * @param {[min, max]: [number, number]} param1
 * @returns {number}
 */
export const getOptimalityOfNumber = (x: number, [min, max]: [number, number]): number => {
	if (x < min || x > max) return 0;
	const middlePoint = (min + max) / 2;
	const distanceFromMiddle = Math.abs(x - middlePoint);
	return 1 - distanceFromMiddle / (max - middlePoint);
};

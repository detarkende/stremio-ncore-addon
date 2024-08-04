const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processInBatches = async <T, R>(
	items: T[],
	batchSize: number,
	delayMs: number,
	fn: (item: T) => Promise<R>,
): Promise<R[]> => {
	const result: R[] = [];
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await Promise.all(batch.map(fn));
		result.push(...batchResults);

		if (i + batchSize < items.length) {
			await delay(delayMs);
		}
	}
	return result;
};
const BATCH_SIZE = 8 as const;

export async function mapInBatches<T, R>(
	items: readonly T[],
	work: (item: T) => Promise<R>,
	size: number = BATCH_SIZE,
): Promise<R[]> {
	const results: R[] = [];

	for (let at = 0; at < items.length; at += size) {
		results.push(...(await Promise.all(items.slice(at, at + size).map((item) => work(item)))));
	}

	return results;
}

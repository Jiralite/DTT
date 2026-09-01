const CACHE_ORIGIN = "https://discord-testers-testers.internal" as const;

export const IDENTITY_MAX_AGE = 300 as const;

export const MEMBERSHIP_MAX_AGE = 300 as const;

export const SUMMARY_MAX_AGE = 300 as const;

export const ABSENT_MAX_AGE = 60 as const;

export const REQUEST_TIMEOUT = 10_000 as const;

declare global {
	interface CacheStorage {
		readonly default: Cache;
	}
}

function keyFor(namespace: string, id: string) {
	return `${CACHE_ORIGIN}/${namespace}/${encodeURIComponent(id)}`;
}

async function keep(key: string, response: Response) {
	try {
		await caches.default.put(key, response);
	} catch {}
}

export async function cached<T>(
	namespace: string,
	id: string,
	maxAge: number,
	resolve: () => Promise<T>,
	absentMaxAge = 0,
): Promise<T> {
	const key = keyFor(namespace, id);

	try {
		const held = await caches.default.match(key);

		if (held) {
			return await held.json();
		}
	} catch {}

	const value = await resolve();

	if (value === null && absentMaxAge === 0) {
		return value;
	}

	await keep(
		key,
		Response.json(value, {
			headers: { "Cache-Control": `max-age=${value === null ? absentMaxAge : maxAge}` },
		}),
	);

	return value;
}

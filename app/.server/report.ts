export function reportAndContinue<T>(fallback: T) {
	return (error: unknown): T => {
		console.error(error);
		return fallback;
	};
}

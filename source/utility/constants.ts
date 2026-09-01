export const ALLOWED_MEDIA_TYPES = [
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/webp",
	"video/mp4",
	"video/quicktime",
] as const satisfies readonly string[];

export const ALLOWED_FILE_TYPES = [
	".gif",
	".jpeg",
	".jpg",
	".mov",
	".mp4",
	".png",
	".webp",
] as const satisfies readonly `.${string}`[];

export const REQUEST_TIMEOUT = 10_000 as const;

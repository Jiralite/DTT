export interface SessionUser {
	id: string;
	username: string;
	global_name: string | null;
	avatar: string | null;
}

export interface Upload {
	key: string;
	filename: string;
	mediaType: string;
	size: number;
	uploadedAt: number;
	url: string;
}

const MEDIA_TYPES_BY_EXTENSION = {
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	mov: "video/quicktime",
	mp4: "video/mp4",
	png: "image/png",
	webp: "image/webp",
} as const satisfies Record<string, string>;

const FALLBACK_MEDIA_TYPE = "application/octet-stream" as const;

const collator = new Intl.Collator("en", { numeric: true });

export function compareNames(left: string, right: string): number {
	return collator.compare(left, right);
}

const UNITS = ["B", "KiB", "MiB"] as const;

export function mediaTypeFor(key: string): string {
	const extension = key.slice(key.lastIndexOf(".") + 1).toLowerCase();

	return (
		MEDIA_TYPES_BY_EXTENSION[extension as keyof typeof MEDIA_TYPES_BY_EXTENSION] ??
		FALLBACK_MEDIA_TYPE
	);
}

export function isVideo(mediaType: string): boolean {
	return mediaType.startsWith("video/");
}

export function formatSize(bytes: number): string {
	let size = bytes;
	let unit = 0;

	while (size >= 1024 && unit < UNITS.length - 1) {
		size /= 1024;
		unit++;
	}

	return `${unit === 0 ? size : size.toFixed(1)} ${UNITS[unit]}`;
}

export function displayNameOf(user: { username: string; global_name: string | null }): string {
	return user.global_name ?? user.username;
}

export function avatarURL(
	user: { id: string; avatar: string | null },
	size: number,
): string | null {
	return user.avatar
		? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=${size}`
		: null;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

export function formatDate(epochMilliseconds: number): string {
	return DATE_FORMAT.format(epochMilliseconds);
}

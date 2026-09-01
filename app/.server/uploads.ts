import { env } from "cloudflare:workers";
import type { Snowflake } from "discord-api-types/v10";
import { mediaTypeFor, type Upload } from "~/utility/media.js";
import { cached, SUMMARY_MAX_AGE } from "./cache.js";

export const SNOWFLAKE = /^\d{17,20}$/;

export async function listUserIds(): Promise<Snowflake[]> {
	const userIds: Snowflake[] = [];
	let cursor: string | undefined;

	do {
		const listed = await env.DISCORD_TESTERS_TESTERS.list({
			delimiter: "/",
			...(cursor && { cursor }),
		});

		for (const prefix of listed.delimitedPrefixes) {
			userIds.push(prefix.slice(0, -1));
		}

		cursor = listed.truncated ? listed.cursor : undefined;
	} while (cursor);

	return userIds.filter((userId) => SNOWFLAKE.test(userId));
}

export async function listUploads(userId: Snowflake): Promise<Upload[]> {
	if (!SNOWFLAKE.test(userId)) {
		throw new Error(`Refusing to list uploads for a malformed identifier: ${userId}.`);
	}

	const uploads: Upload[] = [];
	let cursor: string | undefined;

	do {
		const listed = await env.DISCORD_TESTERS_TESTERS.list({
			prefix: `${userId}/`,
			delimiter: "/",
			include: ["customMetadata", "httpMetadata"],
			...(cursor && { cursor }),
		});

		for (const object of listed.objects) {
			uploads.push({
				key: object.key,
				filename: object.customMetadata?.filename ?? object.key.slice(userId.length + 1),
				mediaType: object.httpMetadata?.contentType ?? mediaTypeFor(object.key),
				size: object.size,
				uploadedAt: object.uploaded.getTime(),
				url: `${env.CDN_URL}/${object.key}`,
			});
		}

		cursor = listed.truncated ? listed.cursor : undefined;
	} while (cursor);

	return uploads.sort((first, second) => second.uploadedAt - first.uploadedAt);
}

export interface UserSummary {
	count: number;
	lastUploadedAt: number;
}

export async function summariseUser(userId: Snowflake): Promise<UserSummary> {
	if (!SNOWFLAKE.test(userId)) {
		throw new Error(`Refusing to summarise a malformed identifier: ${userId}.`);
	}

	return cached("summary", userId, SUMMARY_MAX_AGE, async () => {
		let count = 0;
		let lastUploadedAt = 0;
		let cursor: string | undefined;

		do {
			const listed = await env.DISCORD_TESTERS_TESTERS.list({
				prefix: `${userId}/`,
				delimiter: "/",
				...(cursor && { cursor }),
			});

			for (const object of listed.objects) {
				count++;
				lastUploadedAt = Math.max(lastUploadedAt, object.uploaded.getTime());
			}

			cursor = listed.truncated ? listed.cursor : undefined;
		} while (cursor);

		return { count, lastUploadedAt };
	});
}

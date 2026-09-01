import { env } from "cloudflare:workers";
import { RouteBases, Routes } from "discord-api-types/rest/v10";
import type { APIUser, Snowflake } from "discord-api-types/v10";
import { ABSENT_MAX_AGE, cached, IDENTITY_MAX_AGE, REQUEST_TIMEOUT } from "./cache.js";

export interface PartialUser {
	id: Snowflake;
	username: string;
	global_name: string | null;
	avatar: string | null;
}

export async function getDiscordUser(userId: Snowflake): Promise<PartialUser | null> {
	return cached(
		"user",
		userId,
		IDENTITY_MAX_AGE,
		async () => {
			const response = await fetch(`${RouteBases.api}${Routes.user(userId)}`, {
				headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
				signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			});

			if (response.status === 404) {
				return null;
			}

			if (!response.ok) {
				throw new Error(
					`Discord refused to identify user ${userId} (${response.status}): ${await response.text()}.`,
				);
			}

			const user: APIUser = await response.json();

			return {
				id: user.id,
				username: user.username,
				global_name: user.global_name ?? null,
				avatar: user.avatar,
			};
		},
		ABSENT_MAX_AGE,
	);
}

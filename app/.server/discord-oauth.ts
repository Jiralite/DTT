import { env } from "cloudflare:workers";
import { OAuth2Routes, RouteBases, Routes } from "discord-api-types/rest/v10";
import type {
	APIUser,
	OAuth2Scopes,
	RESTGetAPICurrentUserGuildsResult,
	RESTPostOAuth2AccessTokenResult,
	Snowflake,
} from "discord-api-types/v10";
import { REQUEST_TIMEOUT } from "./cache.js";

const SCOPES = ["identify", "guilds"] as const satisfies readonly `${OAuth2Scopes}`[];

export class DiscordAuthorisationError extends Error {
	public constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "DiscordAuthorisationError";
	}
}

export function createAuthorisationURL(redirectURI: string, state: string): string {
	const url = new URL(OAuth2Routes.authorizationURL);

	url.search = new URLSearchParams({
		client_id: env.DISCORD_APPLICATION_ID,
		response_type: "code",
		redirect_uri: redirectURI,
		scope: SCOPES.join(" "),
		state,
	}).toString();

	return url.href;
}

export async function exchangeAuthorisationCode(
	code: string,
	redirectURI: string,
): Promise<RESTPostOAuth2AccessTokenResult> {
	const response = await fetch(OAuth2Routes.tokenURL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: env.DISCORD_APPLICATION_ID,
			client_secret: env.DISCORD_CLIENT_SECRET,
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectURI,
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	});

	if (!response.ok) {
		throw new DiscordAuthorisationError(
			`Discord refused the authorisation code (${response.status}): ${await response.text()}.`,
		);
	}

	return response.json();
}

async function authorised(accessToken: string, route: string): Promise<Response> {
	return fetch(`${RouteBases.api}${route}`, {
		headers: { Authorization: `Bearer ${accessToken}` },
		signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	});
}

export async function getCurrentUser(accessToken: string): Promise<APIUser> {
	const response = await authorised(accessToken, Routes.user());

	if (!response.ok) {
		throw new DiscordAuthorisationError(
			`Discord refused to identify the user (${response.status}).`,
		);
	}

	return response.json();
}

export async function isInGuild(accessToken: string, guildId: Snowflake): Promise<boolean> {
	const response = await authorised(accessToken, Routes.userGuilds());

	if (response.status === 401) {
		throw new DiscordAuthorisationError("Discord rejected the access token while listing guilds.");
	}

	if (!response.ok) {
		throw new Error(
			`Discord refused to list the user's guilds (${response.status}): ${await response.text()}.`,
		);
	}

	const guilds: RESTGetAPICurrentUserGuildsResult = await response.json();
	return guilds.some(({ id }) => id === guildId);
}

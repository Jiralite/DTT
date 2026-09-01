import { env } from "cloudflare:workers";
import { data, redirect } from "react-router";
import { cached, MEMBERSHIP_MAX_AGE } from "./cache.js";
import { DiscordAuthorisationError, isInGuild } from "./discord-oauth.js";
import { destroySession, getSession, type Session, type SessionUser } from "./session.js";

const DATA_SUFFIX = ".data" as const;

const ROOT_DATA_SUFFIX = "/_.data" as const;

function normalisedPathname(url: URL) {
	return url.pathname.endsWith(ROOT_DATA_SUFFIX)
		? url.pathname.replace(/_\.data$/, "")
		: url.pathname.replace(/\.data$/, "");
}

function signInURL(request: Request) {
	const url = new URL(request.url);

	const pathname = normalisedPathname(url);
	url.searchParams.delete("_routes");
	const search = url.searchParams.toString();
	const returnTo = `${pathname}${search ? `?${search}` : ""}`;

	return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

async function signOut(request: Request, session: Session) {
	return redirect(signInURL(request), {
		headers: { "Set-Cookie": await destroySession(session) },
	});
}

export async function getUser(request: Request): Promise<SessionUser | null> {
	const session = await getSession(request.headers.get("Cookie"));
	return session.get("discord_user") ?? null;
}

export async function requireUser(request: Request): Promise<SessionUser> {
	const session = await getSession(request.headers.get("Cookie"));
	const user = session.get("discord_user");
	const accessToken = session.get("access_token");
	const expiresAt = session.get("expires_at");

	if (!(user && accessToken && expiresAt)) {
		throw redirect(signInURL(request));
	}

	if (Date.now() >= expiresAt) {
		throw await signOut(request, session);
	}

	let member: boolean;

	try {
		member = await cached("membership", user.id, MEMBERSHIP_MAX_AGE, () =>
			isInGuild(accessToken, env.DISCORD_TESTERS_GUILD_ID),
		);
	} catch (error) {
		if (error instanceof DiscordAuthorisationError) {
			throw await signOut(request, session);
		}

		throw error;
	}

	if (!member) {
		throw data("You are not a member of the server this gallery belongs to.", { status: 403 });
	}

	return user;
}

export function resolveReturnTo(value: string | null, origin: string): string {
	if (!value?.startsWith("/")) {
		return "/";
	}

	let url: URL;

	try {
		url = new URL(value, origin);
	} catch {
		return "/";
	}

	if (url.origin !== origin || url.pathname.endsWith(DATA_SUFFIX)) {
		return "/";
	}

	return `${url.pathname}${url.search}`;
}

export function generateState(): string {
	return crypto.randomUUID();
}

export type { SessionUser };

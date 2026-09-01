import { env } from "cloudflare:workers";
import type { Snowflake } from "discord-api-types/v10";
import { createCookieSessionStorage, redirect } from "react-router";
import type { Session as ReactRouterSession } from "react-router";

const MAX_AGE = 604_800 as const;

export interface SessionUser {
	id: Snowflake;
	username: string;
	global_name: string | null;
	avatar: string | null;
}

interface SessionData {
	discord_user?: SessionUser;

	access_token?: string;
	expires_at?: number;
}

interface FlashData {
	oauth_state?: string;
	return_to?: string;
}

export type Session = ReactRouterSession<SessionData, FlashData>;

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
	SessionData,
	FlashData
>({
	cookie: {
		name: "__session",
		httpOnly: true,
		secure: import.meta.env.PROD,
		sameSite: "lax",
		path: "/",
		maxAge: MAX_AGE,
		secrets: [env.SESSION_SECRET],
	},
});

export { destroySession, getSession };

export async function redirectWithSession(to: string, session: Session) {
	return redirect(to, { headers: { "Set-Cookie": await commitSession(session) } });
}

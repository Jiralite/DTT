import { env } from "cloudflare:workers";
import { data } from "react-router";
import { generateState, resolveReturnTo } from "~/.server/authentication.js";
import {
	createAuthorisationURL,
	exchangeAuthorisationCode,
	getCurrentUser,
	isInGuild,
} from "~/.server/discord-oauth.js";
import { getSession, redirectWithSession } from "~/.server/session.js";
import type { Route } from "./+types/login.js";

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const session = await getSession(request.headers.get("Cookie"));
	const redirectURI = new URL("/login", url.origin).href;
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");

	if (code ?? error) {
		const state = url.searchParams.get("state");
		const expectedState = session.get("oauth_state");
		const returnTo = resolveReturnTo(session.get("return_to") ?? null, url.origin);

		if (error || !code || !state || state !== expectedState) {
			return redirectWithSession(returnTo, session);
		}

		const tokens = await exchangeAuthorisationCode(code, redirectURI);
		const [user, member] = await Promise.all([
			getCurrentUser(tokens.access_token),
			isInGuild(tokens.access_token, env.DISCORD_TESTERS_GUILD_ID),
		]);

		if (!member) {
			throw data("You are not a member of the server this gallery belongs to.", { status: 403 });
		}

		session.set("discord_user", {
			id: user.id,
			username: user.username,
			global_name: user.global_name ?? null,
			avatar: user.avatar,
		});

		session.set("access_token", tokens.access_token);
		session.set("expires_at", Date.now() + tokens.expires_in * 1000);

		return redirectWithSession(returnTo, session);
	}

	const state = generateState();
	session.flash("oauth_state", state);
	session.flash("return_to", resolveReturnTo(url.searchParams.get("returnTo"), url.origin));

	return redirectWithSession(createAuthorisationURL(redirectURI, state), session);
}

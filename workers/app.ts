import { isbot } from "isbot";
import { createRequestHandler } from "react-router";
import type { ServerBuild } from "react-router";
import { handleInteractions } from "../source/interactions.js";

const INTERACTIONS_PATHNAME = "/interactions" as const;

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build") as unknown as Promise<ServerBuild>,
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		if (new URL(request.url).pathname === INTERACTIONS_PATHNAME) {
			return handleInteractions(request, env, ctx);
		}

		if (isbot(request.headers.get("User-Agent"))) {
			return new Response(null, {
				status: 204,
				headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nosnippet, noarchive" },
			});
		}

		return requestHandler(request);
	},
} satisfies ExportedHandler<Env>;

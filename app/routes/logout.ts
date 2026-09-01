import { redirect } from "react-router";
import { destroySession, getSession } from "~/.server/session.js";
import type { Route } from "./+types/logout.js";

export async function action({ request }: Route.ActionArgs) {
	const session = await getSession(request.headers.get("Cookie"));

	return redirect("/", { headers: { "Set-Cookie": await destroySession(session) } });
}

export function loader() {
	return redirect("/");
}

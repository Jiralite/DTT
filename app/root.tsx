import type { ReactNode } from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import { getUser } from "~/.server/authentication.js";
import { Shell } from "~/components/Shell.js";
import { SITE_NAME } from "~/utility/constants.js";
import type { Route } from "./+types/root.js";
import "./app.css";

const BRAND_COLOUR = "#5865f2" as const;

export const links: Route.LinksFunction = () => [
	{ rel: "icon", href: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
	{ rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
	{ rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
	{ rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
	{ rel: "mask-icon", href: "/safari-pinned-tab.svg", color: BRAND_COLOUR },
	{ rel: "manifest", href: "/site.webmanifest" },
];

export const meta: Route.MetaFunction = () => [{ title: SITE_NAME }];

export async function loader({ request }: Route.LoaderArgs) {
	return { user: await getUser(request) };
}

export function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta content="#ffffff" media="(prefers-color-scheme: light)" name="theme-color" />
				<meta content="#0d0d0f" media="(prefers-color-scheme: dark)" name="theme-color" />
				<meta name="robots" content="noindex" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App({ loaderData }: Route.ComponentProps) {
	return (
		<Shell user={loaderData.user}>
			<Outlet />
		</Shell>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Something went wrong";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "Not found" : `Error ${error.status}`;

		details =
			typeof error.data === "string"
				? error.data
				: error.status === 404
					? "There is nothing here."
					: (error.statusText ?? details);
	} else if (import.meta.env.DEV && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<Shell user={null}>
			<div className="py-10">
				<h1 className="text-2xl font-bold text-heading">{message}</h1>
				<p className="mt-2 text-muted">{details}</p>
				{stack && (
					<pre className="mt-6 w-full overflow-x-auto rounded-lg bg-sunken p-4 text-xs">
						<code>{stack}</code>
					</pre>
				)}
			</div>
		</Shell>
	);
}

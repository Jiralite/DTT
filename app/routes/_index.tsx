import { Link } from "react-router";
import { requireUser } from "~/.server/authentication.js";
import { mapInBatches } from "~/.server/batches.js";
import { getDiscordUser } from "~/.server/discord-app.js";
import { reportAndContinue } from "~/.server/report.js";
import { listUserIds, summariseUser } from "~/.server/uploads.js";
import { avatarURL, compareNames, displayNameOf, formatDate } from "~/utility/media.js";
import type { Route } from "./+types/_index.js";

export async function loader({ request }: Route.LoaderArgs) {
	await requireUser(request);

	const folders = await mapInBatches(await listUserIds(), async (userId) => {
		const [user, summary] = await Promise.all([
			getDiscordUser(userId).catch(reportAndContinue(null)),
			summariseUser(userId).catch(reportAndContinue(null)),
		]);

		return {
			id: userId,
			name: user ? displayNameOf(user) : userId,
			avatar: user && avatarURL(user, 128),
			count: summary?.count ?? 0,
			lastUploadedAt: summary?.lastUploadedAt ?? 0,
		};
	});

	return {
		folders: folders
			.filter(({ count }) => count > 0)
			.sort((first, second) => compareNames(first.name, second.name)),
	};
}

export default function Index({ loaderData }: Route.ComponentProps) {
	const { folders } = loaderData;

	if (folders.length === 0) {
		return <p className="text-muted">Nothing has been uploaded yet.</p>;
	}

	return (
		<>
			<h2 className="px-2 text-xs font-bold tracking-wide text-muted uppercase">
				Uploaders — {folders.length}
			</h2>
			<ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
				{folders.map((folder) => (
					<li key={folder.id}>
						<Link
							className="flex items-center gap-3 rounded-full bg-raised py-2 pr-5 pl-2 ring-1 ring-line transition-colors hover:bg-hover hover:ring-muted/40"
							prefetch="intent"
							to={`/users/${folder.id}`}
						>
							{folder.avatar ? (
								<img
									alt=""
									className="size-10 shrink-0 rounded-full"
									height={40}
									loading="lazy"
									src={folder.avatar}
									width={40}
								/>
							) : (
								<span className="size-10 shrink-0 rounded-full bg-line" />
							)}
							<span className="min-w-0">
								<span className="block truncate font-medium text-heading">{folder.name}</span>
								<span className="block truncate text-xs text-muted">
									{folder.count} {folder.count === 1 ? "file" : "files"} · last{" "}
									{formatDate(folder.lastUploadedAt)}
								</span>
							</span>
						</Link>
					</li>
				))}
			</ul>
		</>
	);
}

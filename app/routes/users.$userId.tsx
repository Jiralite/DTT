import { Play } from "lucide-react";
import { useState } from "react";
import { data, Link } from "react-router";
import { requireUser } from "~/.server/authentication.js";
import { getDiscordUser } from "~/.server/discord-app.js";
import { listUploads, SNOWFLAKE } from "~/.server/uploads.js";
import { Lightbox } from "~/components/Lightbox.js";
import { SITE_NAME } from "~/utility/constants.js";
import { avatarURL, displayNameOf, formatSize, isVideo } from "~/utility/media.js";
import type { Route } from "./+types/users.$userId.js";

export const meta: Route.MetaFunction = ({ loaderData }) => [
	{ title: loaderData ? `${loaderData.name} · ${SITE_NAME}` : SITE_NAME },
];

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUser(request);
	const { userId } = params;

	if (!SNOWFLAKE.test(userId)) {
		throw data("There is no such folder.", { status: 404 });
	}

	const [user, uploads] = await Promise.all([getDiscordUser(userId), listUploads(userId)]);

	if (uploads.length === 0) {
		throw data("There is no such folder.", { status: 404 });
	}

	return {
		name: user ? displayNameOf(user) : userId,
		avatar: user && avatarURL(user, 128),
		uploads,
	};
}

export default function UserUploads({ loaderData }: Route.ComponentProps) {
	const { name, avatar, uploads } = loaderData;
	const [at, setAt] = useState<number | null>(null);
	const active = at !== null && at < uploads.length ? at : null;

	return (
		<>
			<Link className="text-sm text-muted transition-colors hover:text-body hover:underline" to="/">
				← All uploaders
			</Link>
			<div className="mt-3 flex items-center gap-3">
				{avatar ? (
					<img alt="" className="size-12 rounded-full" height={48} src={avatar} width={48} />
				) : (
					<span className="size-12 rounded-full bg-line" />
				)}
				<div className="min-w-0">
					<h1 className="truncate text-xl font-bold text-heading">{name}</h1>
					<p className="text-sm text-muted">
						{uploads.length} {uploads.length === 1 ? "file" : "files"}
					</p>
				</div>
			</div>
			<ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
				{uploads.map((upload, index) => (
					<li key={upload.key}>
						<button
							className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-sunken ring-line transition hover:ring-2"
							onClick={() => setAt(index)}
							type="button"
						>
							{isVideo(upload.mediaType) ? (
								<>
									<video
										className="size-full object-cover"
										muted
										preload="metadata"
										src={`${upload.url}#t=0.1`}
									/>
									<span
										aria-hidden="true"
										className="absolute inset-0 grid place-items-center text-white/90 transition group-hover:scale-110"
									>
										<Play className="drop-shadow-lg" fill="currentColor" size={40} />
									</span>
								</>
							) : (
								<img
									alt={upload.filename}
									className="size-full object-cover transition group-hover:scale-105"
									loading="lazy"
									src={upload.url}
								/>
							)}
							<span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5 text-left text-xs font-medium text-white/90">
								{formatSize(upload.size)}
							</span>
						</button>
					</li>
				))}
			</ul>
			{active !== null && (
				<Lightbox at={active} onClose={() => setAt(null)} onNavigate={setAt} uploads={uploads} />
			)}
		</>
	);
}

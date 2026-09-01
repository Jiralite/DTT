import { SiGithub } from "@icons-pack/react-simple-icons";
import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import { REPOSITORY_URL, SITE_NAME } from "~/utility/constants.js";
import { avatarURL, displayNameOf, type SessionUser } from "~/utility/media.js";

interface ShellProps {
	user: SessionUser | null;
	children: ReactNode;
}

export function Shell({ user, children }: ShellProps) {
	const avatar = user && avatarURL(user, 64);

	return (
		<div className="min-h-dvh">
			<header className="sticky top-0 z-10 flex h-12 items-center gap-3 bg-base px-4 shadow-header">
				<Link className="min-w-0 truncate font-semibold text-heading" to="/">
					{SITE_NAME}
				</Link>
				<div className="ml-auto flex shrink-0 items-center gap-3">
					<a
						aria-label="View this project on GitHub"
						className="text-muted transition-colors hover:text-body"
						href={REPOSITORY_URL}
						rel="noreferrer"
						target="_blank"
					>
						<SiGithub aria-hidden="true" size={20} />
					</a>
					{user && (
						<>
							<span aria-hidden="true" className="h-6 w-px bg-line" />
							<span className="flex items-center gap-2 text-sm font-medium text-body">
								{avatar ? (
									<img alt="" className="size-6 rounded-full" height={24} src={avatar} width={24} />
								) : (
									<span className="size-6 rounded-full bg-line" />
								)}
								<span className="max-w-32 truncate">{displayNameOf(user)}</span>
							</span>
							<Form action="/logout" method="post">
								<button
									className="rounded-sm px-2 py-1 text-sm text-muted transition-colors hover:bg-raised hover:text-body"
									type="submit"
								>
									Sign out
								</button>
							</Form>
						</>
					)}
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
		</div>
	);
}

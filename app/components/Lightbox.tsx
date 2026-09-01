import { Check, ChevronLeft, ExternalLink, Link, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatSize, isVideo, type Upload } from "~/utility/media.js";

interface LightboxProps {
	uploads: readonly Upload[];
	at: number;
	onClose: () => void;
	onNavigate: (at: number) => void;
}

const CONTROL =
	"grid size-10 place-items-center rounded-full bg-floating/60 text-body backdrop-blur transition-colors hover:bg-floating hover:text-heading" as const;

const ARROW =
	"absolute top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-floating/60 text-body backdrop-blur transition-colors hover:bg-floating hover:text-heading" as const;

export function Lightbox({ uploads, at, onClose, onNavigate }: LightboxProps) {
	const upload = uploads[at];
	const [copied, setCopied] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setCopied(false);
	}, [at]);

	useEffect(() => {
		dialogRef.current?.focus();
	}, []);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			switch (event.key) {
				case "Escape":
					onClose();
					break;
				case "ArrowLeft":
					onNavigate((at - 1 + uploads.length) % uploads.length);
					break;
				case "ArrowRight":
					onNavigate((at + 1) % uploads.length);
					break;
				default:
					return;
			}

			event.preventDefault();
		}

		window.addEventListener("keydown", onKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = "";
		};
	}, [at, uploads.length, onClose, onNavigate]);

	if (!upload) {
		return null;
	}

	async function copy(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}

	const many = uploads.length > 1;

	return (
		<div
			aria-label={upload.filename}
			aria-modal="true"
			className="fixed inset-0 z-50 bg-floating/85 backdrop-blur-sm focus-visible:outline-none"
			onClick={onClose}
			ref={dialogRef}
			role="dialog"
			tabIndex={-1}
		>
			<div
				className="absolute top-0 right-0 z-20 flex items-center gap-1 p-2 sm:p-3"
				onClick={stop}
			>
				<button
					aria-label={copied ? "Link copied" : "Copy link"}
					className={CONTROL}
					onClick={() => void copy(upload.url)}
					type="button"
				>
					{copied ? <Check size={20} /> : <Link size={20} />}
				</button>
				<a
					aria-label="Open original"
					className={CONTROL}
					href={upload.url}
					rel="noreferrer"
					target="_blank"
				>
					<ExternalLink size={20} />
				</a>
				<button aria-label="Close" className={CONTROL} onClick={onClose} type="button">
					<X size={20} />
				</button>
			</div>

			{many && (
				<>
					<button
						aria-label="Previous"
						className={`${ARROW} left-2`}
						onClick={() => onNavigate((at - 1 + uploads.length) % uploads.length)}
						type="button"
					>
						<ChevronLeft size={20} />
					</button>
					<button
						aria-label="Next"
						className={`${ARROW} right-2 rotate-180`}
						onClick={() => onNavigate((at + 1) % uploads.length)}
						type="button"
					>
						<ChevronLeft size={20} />
					</button>
				</>
			)}

			<div className="flex h-full items-center justify-center px-14 pt-16 pb-14 sm:px-20">
				{isVideo(upload.mediaType) ? (
					<video
						className="max-h-full max-w-full rounded-lg shadow-2xl"
						controls
						onClick={stop}
						playsInline
						src={upload.url}
					/>
				) : (
					<img
						alt={upload.filename}
						className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
						onClick={stop}
						src={upload.url}
					/>
				)}
			</div>

			<div
				className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-baseline justify-center gap-x-2 px-4 pb-3 text-xs sm:text-sm"
				onClick={stop}
			>
				<span className="max-w-full truncate font-medium text-heading">{upload.filename}</span>
				<span className="text-muted">
					{formatSize(upload.size)}
					{many && ` · ${at + 1} of ${uploads.length}`}
				</span>
			</div>
		</div>
	);
}

function stop(event: { stopPropagation: () => void }) {
	event.stopPropagation();
}

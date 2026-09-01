import type {
	APIAttachment,
	APIChatInputApplicationCommandGuildInteraction,
} from "discord-api-types/v10";
import { REQUEST_TIMEOUT } from "../utility/constants.js";
import { md5Hash } from "../utility/functions.js";

interface UploadOptions {
	interaction: APIChatInputApplicationCommandGuildInteraction;
	attachment: APIAttachment;
	r2: R2Bucket;
	cdnURL: string;
}

export async function upload({ interaction, attachment, r2, cdnURL }: UploadOptions) {
	const response = await fetch(attachment.url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });

	if (!response.ok) {
		throw new Error(`Failed to fetch attachment: ${response.status} ${response.statusText}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	const hash = await md5Hash(arrayBuffer);
	const extension = attachment.filename.slice(attachment.filename.lastIndexOf(".") + 1);
	const userId = interaction.member.user.id;

	const r2Object = await r2.put(`${userId}/${hash}.${extension}`, arrayBuffer, {
		httpMetadata: {
			...(attachment.content_type && { contentType: attachment.content_type }),
			contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
		},
		customMetadata: { userId, filename: attachment.filename },
	});

	return `<${cdnURL}/${r2Object.key}>`;
}

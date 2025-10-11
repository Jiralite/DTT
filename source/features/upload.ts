import type {
	APIAttachment,
	APIChatInputApplicationCommandGuildInteraction,
} from "discord-api-types/v10";
import { md5Hash } from "../utility/functions.js";

interface UploadOptions {
	interaction: APIChatInputApplicationCommandGuildInteraction;
	attachment: APIAttachment;
	r2: R2Bucket;
	cdnURL: string;
}

export async function upload({ interaction, attachment, r2, cdnURL }: UploadOptions) {
	const response = await fetch(attachment.url);

	if (!response.ok) {
		throw new Error(`Failed to fetch attachment: ${response.status} ${response.statusText}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	const hash = await md5Hash(arrayBuffer);
	const extension = attachment.filename.slice(attachment.filename.lastIndexOf(".") + 1);
	const userId = interaction.member.user.id;

	const r2Object = await r2.put(`${userId}/${hash}.${extension}`, arrayBuffer, {
		customMetadata: { userId },
	});

	return `<${cdnURL}/${r2Object.key}>`;
}

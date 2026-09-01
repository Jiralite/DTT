import { RouteBases, Routes } from "discord-api-types/rest/v10";
import {
	type APIChatInputApplicationCommandGuildInteraction,
	type APIInteraction,
	type APIInteractionResponse,
	type APIMessageTopLevelComponent,
	ComponentType,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
	type RESTPatchAPIWebhookWithTokenMessageJSONBody,
	type Snowflake,
} from "discord-api-types/v10";
import { upload } from "./features/upload.js";
import { ALLOWED_MEDIA_TYPES, REQUEST_TIMEOUT } from "./utility/constants.js";
import { hexToUint8Array, isGuildChatInputCommand } from "./utility/functions.js";

const MAXIMUM_SIZE = 10_485_760 as const;

function respond(response: APIInteractionResponse) {
	return Response.json(response);
}

function reply(content: string) {
	return respond({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: { content, flags: MessageFlags.Ephemeral },
	});
}

async function editReply(
	applicationId: Snowflake,
	token: string,
	body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
) {
	const response = await fetch(
		`${RouteBases.api}${Routes.webhookMessage(applicationId, token, "@original")}`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Discord refused to edit the reply (${response.status}): ${await response.text()}.`,
		);
	}
}

async function completeUpload(
	interaction: APIChatInputApplicationCommandGuildInteraction,
	env: Env,
) {
	const { application_id: applicationId, token } = interaction;

	try {
		const attachments = Object.values(interaction.data.resolved?.attachments ?? {});

		if (attachments.length === 0) {
			await editReply(applicationId, token, {
				content: "No attachments provided.",
			});

			return;
		}

		const sizeErrors: string[] = [];
		const mediaTypeErrors: string[] = [];

		for (const attachment of attachments) {
			if (attachment.size > MAXIMUM_SIZE) {
				sizeErrors.push(`- ${attachment.filename} (${attachment.size} bytes)`);
			}

			if (
				!ALLOWED_MEDIA_TYPES.includes(
					attachment.content_type as (typeof ALLOWED_MEDIA_TYPES)[number],
				)
			) {
				mediaTypeErrors.push(`- ${attachment.filename}`);
			}
		}

		const components: APIMessageTopLevelComponent[] = [];

		if (sizeErrors.length > 0) {
			components.push({
				type: ComponentType.TextDisplay,
				content: `Assets must not exceed 10MiB. The following exceeded this limit:\n${sizeErrors.join("\n")}`,
			});
		}

		if (mediaTypeErrors.length > 0) {
			components.push({
				type: ComponentType.TextDisplay,
				content: `Assets must be of a valid media type. Allowed types: ${ALLOWED_MEDIA_TYPES.join(",")}\nThe following had invalid media types:\n${mediaTypeErrors.join("\n")}`,
			});
		}

		if (components.length > 0) {
			await editReply(applicationId, token, {
				components,
				flags: MessageFlags.IsComponentsV2,
			});

			return;
		}

		const urls = await Promise.all(
			attachments.map((attachment) =>
				upload({
					interaction,
					attachment,
					r2: env.DISCORD_TESTERS_TESTERS,
					cdnURL: env.CDN_URL,
				}),
			),
		);

		await editReply(applicationId, token, {
			content: urls.length === 1 ? urls[0] : urls.map((url) => `- ${url}`).join("\n"),
		});
	} catch (error) {
		console.error("Error completing upload.", error);

		try {
			await editReply(applicationId, token, {
				content: "Error uploading attachments.",
			});
		} catch (editError) {
			console.error("Error reporting the upload failure.", editError);
		}
	}
}

export async function handleInteractions(request: Request, env: Env, ctx: ExecutionContext) {
	if (request.method !== "POST") {
		return new Response(null, { status: 405 });
	}

	const signature = request.headers.get("X-Signature-Ed25519");
	const timestamp = request.headers.get("X-Signature-Timestamp");
	const body = await request.text();

	if (!(signature && timestamp && body)) {
		return new Response(null, { status: 401 });
	}

	const encoder = new TextEncoder();
	const message = encoder.encode(timestamp + body);
	const signatureUint8 = hexToUint8Array(signature);
	const publicKeyUint8 = hexToUint8Array(env.PUBLIC_KEY);

	const key = await crypto.subtle.importKey("raw", publicKeyUint8, { name: "Ed25519" }, false, [
		"verify",
	]);

	let verified: boolean;

	try {
		verified = await crypto.subtle.verify("Ed25519", key, signatureUint8, message);
	} catch {
		return new Response(null, { status: 401 });
	}

	if (!verified) {
		return new Response(null, { status: 401 });
	}

	const interaction = JSON.parse(body) as APIInteraction;

	if (interaction.type === InteractionType.Ping) {
		console.info("Ping.", interaction);
		return respond({ type: InteractionResponseType.Pong });
	}

	if (interaction.guild_id !== env.DISCORD_TESTERS_GUILD_ID) {
		return reply("Disallowed.");
	}

	if (isGuildChatInputCommand(interaction) && interaction.data.name === "upload") {
		ctx.waitUntil(completeUpload(interaction, env));

		return respond({
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data: { flags: MessageFlags.Ephemeral },
		});
	}

	console.warn("Unknown interaction.", interaction);
	return reply("Unknown.");
}

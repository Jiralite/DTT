import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import {
	type APIInteraction,
	type APIInteractionResponsePong,
	type APIMessageTopLevelComponent,
	ComponentType,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
} from "discord-api-types/v10";
import { upload } from "./features/upload.js";
import { ALLOWED_MEDIA_TYPES } from "./utility/constants.js";
import { hexToUint8Array, isGuildChatInputCommand } from "./utility/functions.js";

interface Env {
	PUBLIC_KEY: string;
	DISCORD_TESTERS_TESTERS: R2Bucket;
	DISCORD_TESTERS_GUILD_ID: string;
	CDN_URL: string;
}

export default {
	async fetch(request, env, ctx) {
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

		const verified = await crypto.subtle.verify("Ed25519", key, signatureUint8, message);

		if (!verified) {
			return new Response(null, { status: 401 });
		}

		const interaction = JSON.parse(body) as APIInteraction;

		if (interaction.type === InteractionType.Ping) {
			console.info("Ping.", interaction);

			return Response.json(
				{ type: InteractionResponseType.Pong } satisfies APIInteractionResponsePong,
				{ status: 200 },
			);
		}

		const api = new API(new REST());

		try {
			if (interaction.guild_id !== env.DISCORD_TESTERS_GUILD_ID) {
				await api.interactions.reply(interaction.id, interaction.token, {
					content: "Disallowed.",
					flags: MessageFlags.Ephemeral,
				});

				return new Response(null, { status: 200 });
			}

			if (isGuildChatInputCommand(interaction) && interaction.data.name === "upload") {
				const defer = api.interactions.defer(interaction.id, interaction.token, {
					flags: MessageFlags.Ephemeral,
				});

				ctx.waitUntil(
					(async () => {
						await defer;
						const attachments = Object.values(interaction.data.resolved!.attachments!);

						if (attachments.length === 0) {
							await api.interactions.editReply(interaction.application_id, interaction.token, {
								content: "No attachments provided.",
							});

							return;
						}

						const sizeErrors: string[] = [];
						const mediaTypeErrors: string[] = [];

						for (const attachment of attachments) {
							if (attachment.size > 10_485_760) {
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
							await api.interactions.editReply(interaction.application_id, interaction.token, {
								components,
								flags: MessageFlags.IsComponentsV2,
							});

							return;
						}

						let urls: string[];

						try {
							urls = await Promise.all(
								attachments.map((attachment) =>
									upload({
										interaction,
										attachment,
										r2: env.DISCORD_TESTERS_TESTERS,
										cdnURL: env.CDN_URL,
									}),
								),
							);
						} catch (error) {
							console.error("Error uploading attachments.", error);

							await api.interactions.editReply(interaction.application_id, interaction.token, {
								content: "Error uploading attachments.",
							});

							return;
						}

						await api.interactions.editReply(interaction.application_id, interaction.token, {
							content: urls.length === 1 ? urls[0] : urls.map((url) => `- ${url}`).join("\n"),
						});
					})(),
				);

				await defer;
				return new Response(null, { status: 200 });
			}
		} catch (error) {
			console.error("Error handling interaction.", error);
			return new Response(null, { status: 200 });
		}

		console.warn("Unknown interaction.", interaction);

		await api.interactions.reply(interaction.id, interaction.token, {
			content: "Unknown.",
			flags: MessageFlags.Ephemeral,
		});

		return new Response(null, { status: 200 });
	},
} satisfies ExportedHandler<Env>;

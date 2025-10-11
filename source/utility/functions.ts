import {
	type APIChatInputApplicationCommandGuildInteraction,
	type APIInteraction,
	ApplicationCommandType,
	InteractionType,
} from "discord-api-types/v10";

export function hexToUint8Array(hex: string) {
	const uint8 = new Uint8Array(hex.length / 2);

	for (let i = 0; i < hex.length; i += 2) {
		uint8[i / 2] = Number.parseInt(hex.substring(i, i + 2), 16);
	}

	return uint8;
}

export async function md5Hash(arrayBuffer: ArrayBuffer) {
	const hashBuffer = await crypto.subtle.digest("MD5", arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isGuildChatInputCommand(
	interaction: APIInteraction,
): interaction is APIChatInputApplicationCommandGuildInteraction {
	return (
		interaction.type === InteractionType.ApplicationCommand &&
		interaction.data.type === ApplicationCommandType.ChatInput &&
		"guild_id" in interaction
	);
}

import {
	API,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	type RESTPutAPIApplicationCommandsJSONBody,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { ALLOWED_FILE_TYPES } from "./constants.ts";

const ATTACHMENT_LIMIT = 10 as const;

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
	throw new Error("DISCORD_TOKEN is not set.");
}

const COMMANDS: RESTPutAPIApplicationCommandsJSONBody = [
	{
		name: "upload",
		description: "Upload files! Links will be returned.",
		options: Array.from({ length: ATTACHMENT_LIMIT }, (_, index) => ({
			type: ApplicationCommandOptionType.Attachment,
			name: `attachment-${index + 1}`,
			description: "A file to upload.",
			required: false,
			file_types: [...ALLOWED_FILE_TYPES],
		})),
		integration_types: [ApplicationIntegrationType.UserInstall],
		contexts: [InteractionContextType.Guild],
	},
];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
const api = new API(rest);
const applicationId = (await api.users.getCurrent()).id;
console.info("Setting application commands...");

try {
	await api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, COMMANDS);
	console.info("Successfully set application commands.");
} catch (error) {
	console.error("Error setting application commands.", error);
}

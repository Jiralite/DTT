import {
	API,
	ApplicationCommandOptionType,
	ApplicationIntegrationType,
	InteractionContextType,
	type RESTPutAPIApplicationCommandsJSONBody,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
	throw new Error("DISCORD_TOKEN is not set.");
}

const COMMANDS: RESTPutAPIApplicationCommandsJSONBody = [
	{
		name: "upload",
		description: "Upload files! Links will be returned.",
		options: [
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-1",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-2",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-3",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-4",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-5",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-6",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-7",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-8",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-9",
				description: "A file to upload.",
				required: false,
			},
			{
				type: ApplicationCommandOptionType.Attachment,
				name: "attachment-10",
				description: "A file to upload.",
				required: false,
			},
		],
		integration_types: [ApplicationIntegrationType.UserInstall],
		contexts: [InteractionContextType.Guild],
	},
] as const;

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

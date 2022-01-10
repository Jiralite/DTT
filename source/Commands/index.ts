import { ApplicationCommandData, ApplicationCommandPermissionData, CommandInteraction } from "discord.js";

// Free BugMail
import free_bugmail from "./Free BugMail/free-bugmail.js";

// General
import invite from "./General/invite.js";
import remember from "./General/remember.js";
import roles from "./General/roles.js";

const commands = {
  "free-bugmail": new free_bugmail(),
  invite: new invite(),
  remember: new remember(),
  roles: new roles()
} as const;

export type CommandName = keyof typeof commands;

export function isCommandName(commandName: string): commandName is CommandName {
  return commandName in commands;
}

export interface Command {
  name: CommandName;
  type: number;
  handle(interaction: CommandInteraction<"cached">): Promise<void>;
  get commandData(): CommandStructure;
}

export interface CommandStructure {
  applicationCommandData: ApplicationCommandData;
  permissions: ApplicationCommandPermissionData[];
}

export default commands;

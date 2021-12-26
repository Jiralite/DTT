import { ApplicationCommandData, ApplicationCommandPermissionData, ButtonInteraction, CommandInteraction, ContextMenuInteraction, GuildEmoji, GuildMember, MessageActionRowOptions, NewsChannel, Role, SelectMenuInteraction, TextChannel } from "discord.js";
import Free_BugMail from "./Free BugMail/index.js";
import General from "./General/index.js";

export enum CommandName {
  "free-bugmail" = "free-bugmail",
  invite = "invite",
  regenerate = "regenerate",
  remember = "remember",
  roles = "roles"
}

export function isCommandName(commandName: string): commandName is CommandName {
  return commandName in CommandName;
}

export interface Command {
  name: keyof typeof CommandName;
  type: number;
  handle(interaction: ButtonInteraction<"cached"> | CommandInteraction<"cached"> | ContextMenuInteraction<"cached">, subcommand?: string | null): Promise<void>;
  get commandData(): CommandStructure;
}

export interface CommandStructure {
  applicationCommandData: ApplicationCommandData;
  permissions: ApplicationCommandPermissionData[];
}

export interface FreeBugMailCommand extends Command {
  submit(interaction: CommandInteraction<"cached">): void;
  edit(interaction: CommandInteraction<"cached">): void;
  complete(interaction: CommandInteraction<"cached">): void;
}

export interface InviteCommand extends Command {
  execute(interaction: CommandInteraction<"cached">): void;
}

export interface RegenerateCommand extends Command {
  execute(interaction: CommandInteraction<"cached">): Promise<void>;
  readMe(channel: TextChannel | NewsChannel): Promise<void>;
  bugmailQueue(channel: TextChannel | NewsChannel): Promise<void>;
}

export interface RememberCommand extends Command {
  execute(interaction: CommandInteraction<"cached">): Promise<void>;
}

export type RoleCategories = "macOS" | "Linux" | "Windows" | "Android" | "iOS" | "Chrome OS" | "Miscellaneous" | "Experiments" | "Discord Updates" | "Phabricator Updates";
export type SubRoleCategories = "macOSVersionRoles" | "windowsVersionRoles" | "androidDeviceRoles" | "androidVersionRoles" | "iOSDeviceRoles" | "iOSVersionRoles" | "iOSMiscellaneousRoles" | "miscellaneousRoles" | "experimentRoles" | "discordUpdatesRoles" | "phabricatorUpdatesRoles";

export interface RoleStructure {
  role: Role;
  emoji: GuildEmoji | string;
}

export interface RolesCommand extends Command {
  execute(interaction: ButtonInteraction<"cached"> | CommandInteraction<"cached">): void;
  categoryInteraction(interaction: SelectMenuInteraction<"cached"> | NewsChannel, category: RoleCategories): void;
  category(guildMember: GuildMember, category: RoleCategories): MessageActionRowOptions[];
  resolveSelectMenuCategoryRoles(categoryRoleName: SubRoleCategories): RoleStructure[];
  get macOSVersionRoles(): RoleStructure[];
  get linux(): RoleStructure;
  get windowsVersionRoles(): RoleStructure[];
  get androidDeviceRoles(): RoleStructure[];
  get androidVersionRoles(): RoleStructure[];
  get iOSDeviceRoles(): RoleStructure[];
  get iOSVersionRoles(): RoleStructure[];
  get iOSMiscellaneousRoles(): RoleStructure[];
  get chromebook(): RoleStructure;
  get miscellaneousRoles(): RoleStructure[];
  get experimentRoles(): RoleStructure[];
  get discordUpdatesRoles(): RoleStructure[];
  get phabricatorUpdatesRoles(): RoleStructure[];
}

export default [
  ...Free_BugMail,
  ...General
];

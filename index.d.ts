import { Snowflake } from "discord.js";

declare module "discord.js" {
  type VerificationType = "TESTER" | "ALT" | "DENY";
  type FreeBugMailState = "OPEN" | "PENDING" | "DISABLED" | "RESOLVED";
  type RoleCategories = "macOS" | "Linux" | "Windows" | "Android" | "iOS" | "Chrome OS" | "Miscellaneous" | "Experiments" | "Discord Updates" | "Phabricator Updates";
  type SubRoleCategories = "macOSVersionRoles" | "windowsVersionRoles" | "androidDeviceRoles" | "androidVersionRoles" | "iOSDeviceRoles" | "iOSVersionRoles" | "iOSMiscellaneousRoles" | "miscellaneousRoles" | "experimentRoles" | "discordUpdatesRoles" | "phabricatorUpdatesRoles";

  type CommandName = "free-bugmail" | "invite" | "regenerate" | "remember" | "roles";

  interface Command {
    name: CommandName;
    type: number;
    handle(interaction: ButtonInteraction | CommandInteraction | ContextMenuInteraction, subcommand?: string | null): Promise<void>;
    get commandData(): CommandStructure;
  }

  type ImageName = "Opinion";

  interface FreeBugMailCommand extends Command {
    submit(interaction: CommandInteraction): void;
    edit(interaction: CommandInteraction): void;
    complete(interaction: CommandInteraction): void;
  }

  interface InviteCommand extends Command {
    execute(interaction: CommandInteraction): void;
  }

  interface RegenerateCommand extends Command {
    execute(interaction: CommandInteraction): Promise<void>;
    readMe(channel: TextChannel | NewsChannel): Promise<void>;
    bugmailQueue(channel: TextChannel | NewsChannel): Promise<void>;
  }

  interface RememberCommand extends Command {
    execute(interaction: CommandInteraction): Promise<void>;
  }

  interface RolesCommand extends Command {
    execute(interaction: ButtonInteraction | CommandInteraction): void;
    categoryInteraction(interaction: SelectMenuInteraction | NewsChannel, category: RoleCategories): void;
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

  interface RoleStructure {
    role: Role;
    emoji: GuildEmoji | string;
  }

  interface CommandStructure {
    applicationCommandData: ApplicationCommandData;
    permissions: ApplicationCommandPermissionData[];
  }

  interface FreeBugMailData {
    No: number | null;
    Timestamp: number;
    "Weekly Timestamp": number;
    "Message ID": Snowflake;
    "User ID": Snowflake;
    "Claimed By ID": Snowflake | null;
    Mentioned: boolean | null;
    State: FreeBugMailState | null;
  }
}

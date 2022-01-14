import process from "node:process";
import {
  Client,
  ClientOptions,
  Constants,
  Guild,
  GuildChannel,
  GuildEmoji,
  Intents,
  MessageOptions,
  Permissions,
  Role,
  TextChannel,
  ThreadChannel
} from "discord.js";
import { createPool } from "mariadb";

import commands, { CommandName } from "../Commands/index.js";
import { channels, emojis, guildId, roles } from "../Utility/Constants.js";

const mariaUser = process.env["MARIA_USER"] || null;
const mariaPassword = process.env["MARIA_PASSWORD"] || null;
const mariaHost = process.env["MARIA_HOST"] || null;
const mariaDatabase = process.env["MARIA_DATABASE"] || null;

if (mariaUser === null || mariaPassword === null || mariaHost === null || mariaDatabase === null)
  throw new ReferenceError("Missing required database credentials.");

export const Maria = createPool({
  user: mariaUser,
  password: mariaPassword,
  host: mariaHost,
  database: mariaDatabase
});

class DTT<T extends boolean> extends Client<T> {
  constructor(options: ClientOptions) {
    super(options);
  }

  log(message: string, consoleLog: any = message): void {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;

    this.logChannel
      .send({
        content: `${stamp} ${message}`,
        allowedMentions: {
          parse: []
        }
      })
      .catch(() => this.logChannel.send(`${stamp} Couldn't send a response.`));
  }

  freeBugMailLog(message: string, consoleLog: any = message): void {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;
    if (message.length >= 2000) message = `${message.slice(0, 1997)}...`;

    this.freeBugMailLogChannel
      .send({
        content: `${stamp} ${message}`,
        allowedMentions: {
          parse: []
        }
      })
      .catch(() => this.freeBugMailLogChannel.send(`${stamp} Couldn't send a response.`));
  }

  async inviteLog(message: string | Omit<MessageOptions, "allowedMentions">, consoleLog: any = message): Promise<void> {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    if (!this.isReady()) throw new Error("Client logging when not ready.");
    const me = await this.guild.members.fetch(this.user.id);
    const inviteLogs = this.channel("invite-logs");
    if (!inviteLogs.isText()) throw new Error("Attempting to log in a non-text-based channel.");

    if (!inviteLogs.permissionsFor(me).has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL])) {
      throw new Error("Missing permissions to log.");
    }

    stamp = `\`[${stamp}]\``;
    typeof message === "string"
      ? (message = { content: `${stamp} ${message}` })
      : (message.content = `${stamp} ${message.content}`);

    inviteLogs.send({
      allowedMentions: {
        parse: []
      },
      ...message
    });
  }

  consoleLog(consoleLog: any, stamp = new Date().toISOString()): void {
    console.log(`- - - - - ${stamp} - - - - -`);
    console.log(consoleLog);
  }

  async applyCommands(): Promise<void> {
    try {
      const applicationCommands = await this.guild.commands.set(
        Object.values(commands).map(({ commandData: { applicationCommandData } }) => applicationCommandData)
      );
      this.consoleLog(
        applicationCommands.map(({ name, type }) => `Set ${name} as an ${type} application command.`).join("\n")
      );

      const applicationCommandsPermissions = await this.guild.commands.permissions.set({
        fullPermissions: applicationCommands.map(({ id, name }) => ({
          id,
          permissions: commands[name as CommandName].commandData.permissions
        }))
      });

      this.consoleLog(
        applicationCommandsPermissions
          .map((_, id) => `Set the permissions of ${applicationCommands.get(id)!.name}.`)
          .join("\n")
      );
      this.consoleLog("Finished applying commands!");
    } catch (error) {
      this.log("Failed to apply commands.", error);
    }
  }

  channel(c: keyof typeof channels): GuildChannel {
    const _channel = this.guild.channels.resolve(channels[c]);
    if (_channel === null) throw new ReferenceError(`Channel "${c}" cannot be found.`);
    if (_channel instanceof ThreadChannel)
      throw new TypeError(`Channel "${_channel.name}" is a thread. Threads cannot be used here.`);
    return _channel;
  }

  emoji(e: keyof typeof emojis): GuildEmoji {
    const _emoji = this.emojis.resolve(emojis[e]);
    if (_emoji === null) throw new ReferenceError(`Emoji "${e}" cannot be found.`);
    return _emoji;
  }

  role(r: keyof typeof roles): Role {
    const _role = this.guild.roles.resolve(roles[r]);
    if (_role === null) throw new ReferenceError(`Role "${r}" cannot be found.`);
    return _role;
  }

  get guild(): Guild {
    const _guild = this.guilds.resolve(guildId);
    if (_guild === null) throw new ReferenceError("DTT guild cannot be found.");
    return _guild;
  }

  get logChannel(): TextChannel {
    return this.channel("dtt-bot-log") as TextChannel;
  }

  get freeBugMailLogChannel(): TextChannel {
    return this.channel("dtt-bugmail-logs") as TextChannel;
  }

  get modRoles(): Role[] {
    return [this.role("Admin"), this.role("Moderator"), this.role("DT Staff"), this.role("DT Mod or BA")];
  }
}

export default new DTT<true>({
  partials: [Constants.PartialTypes.GUILD_MEMBER, Constants.PartialTypes.MESSAGE],
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_INVITES
  ]
});

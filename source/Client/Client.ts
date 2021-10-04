import { readdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Client, ClientOptions, Collection, Command, CommandName, Constants, Guild, GuildChannel, GuildEmoji, ImageName, Intents, Role, TextChannel, ThreadChannel } from "discord.js";
import { createPool } from "mariadb";
import { BBAGuildId, channels, emojis, guildId, roles } from "../Utility/Constants.js";

import FreeBugMail from "./FreeBugMail.js";
import Invite from "./Invite.js";
import Verification from "./Verification.js";
import commands from "../Commands/index.js";

const imagesPath = `${dirname(fileURLToPath(import.meta.url))}/../../Resources/`;
const images = readdirSync(imagesPath).filter(heading => heading.endsWith(".png"));

const pool = createPool({
  user: process.env.MARIA_USER,
  password: process.env.MARIA_PASSWORD,
  host: process.env.MARIA_HOST,
  database: process.env.MARIA_DATABASE,
  collation: process.env.MARIA_COLLATION
});

class DTT <T extends boolean> extends Client<T> {
  readonly Maria = pool;
  readonly FreeBugMail = FreeBugMail;
  readonly Invite = Invite;
  readonly Verification = Verification;
  readonly commands: Record<CommandName, Command>;
  readonly freeBugMails: Collection<number, FreeBugMail>;
  readonly images: Record<ImageName, string>;
  readonly invites: Collection<number, Invite>;

  constructor(options: ClientOptions) {
    super(options);

    this.commands = commands.reduce((_commands, command) => {
      const _command = new command();
      _commands[_command.name] = _command;
      return _commands;
    }, {} as Record<CommandName, Command>);

    this.freeBugMails = new Collection();

    this.images = images.reduce((_images, image) => {
      _images[image.slice(0, image.indexOf(".")) as ImageName] = imagesPath + image;
      return _images;
    }, {} as Record<ImageName, string>);

    this.invites = new Collection();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(message: string, consoleLog: any = message): void {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;

    this.logChannel.send({
      content: `${stamp} ${message}`,
      allowedMentions: {
        parse: []
      }
    }).catch(() => this.logChannel.send(`${stamp} Couldn't send a response.`));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  freeBugMailLog(message: string, consoleLog: any = message): void {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;
    if (message.length >= 2000) message = `${message.slice(0, 1997)}...`;

    this.freeBugMailLogChannel.send({
      content: `${stamp} ${message}`,
      allowedMentions: {
        parse: []
      }
    }).catch(() => this.freeBugMailLogChannel.send(`${stamp} Couldn't send a response.`));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  consoleLog(consoleLog: any, stamp = new Date().toISOString()): void {
    console.log(`- - - - - ${stamp} - - - - -`);
    console.log(consoleLog);
  }

  async applyCommands(): Promise<void> {
    try {
      const applicationCommands = await this.guild.commands.set(Object.values(this.commands).map(({ commandData: { applicationCommandData } }) => applicationCommandData));
      this.consoleLog(applicationCommands.map(({ name }) => `Set ${name} as an application command.`).join("\n"));

      const applicationCommandsPermissions = await this.guild.commands.permissions.set({
        fullPermissions: applicationCommands.map(({ id, name }) => ({
          id,
          permissions: this.commands[name as CommandName].commandData.permissions
        }))
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.consoleLog(applicationCommandsPermissions.map((_, id) => `Set the permissions of ${applicationCommands.get(id)!.name}.`).join("\n"));
      this.consoleLog("Finished applying commands!");
    } catch (error) {
      this.log("Failed to apply commands.", error);
    }
  }

  channel(c: keyof typeof channels): GuildChannel {
    const _channel = this.guild.channels.resolve(channels[c]);
    if (_channel === null) throw new ReferenceError(`Channel "${c}" cannot be found.`);
    if (_channel instanceof ThreadChannel) throw new TypeError(`Channel "${_channel.name}" is a thread. Threads cannot be used here.`);
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

  get BBAGuild(): Guild {
    const _guild = this.guilds.resolve(BBAGuildId);
    if (_guild === null) throw new ReferenceError("BBA guild cannot be found.");
    return _guild;
  }

  get logChannel(): TextChannel {
    return this.channel("dtt-bot-log") as TextChannel;
  }

  get freeBugMailLogChannel(): TextChannel {
    return this.channel("dtt-bugmail-logs") as TextChannel;
  }

  get modRoles(): Role[] {
    return [
      this.role("Admin"),
      this.role("Moderator"),
      this.role("DT Staff"),
      this.role("DT Mod or BA")
    ];
  }
}

export default new DTT<true>({
  partials: [
    Constants.PartialTypes.MESSAGE
  ],
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_INVITES
  ]
});

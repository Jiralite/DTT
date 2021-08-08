import { Client, ClientOptions, Collection, Guild, GuildChannel, Role, Snowflake, TextChannel, ThreadChannel } from "discord.js";
import { readdirSync } from "fs";
import { createPool, Pool } from "mysql";

import Keys from "./Keys.json";
import FreeBugMail from "./FreeBugMail.js";
import Invite from "./Invite.js";
import Verification from "./Verification.js";

const { mysql } = Keys;
const Maria = createPool(mysql);

export default class DTT extends Client {
  readonly Maria: Pool;
  readonly commands: Collection<string, any>;
  readonly FreeBugMail;
  readonly Invite;
  readonly Verification;
  readonly freeBugMails: Collection<number, any>;
  readonly invites: Collection<number, any>;

  constructor(options: ClientOptions) {
    super(options);
    this.Maria = Maria;
    this.commands = ((): Collection<string, any> => {
      const commandsCollection: Collection<string, any> = new Collection();

      const folders = readdirSync("./Commands", {
        withFileTypes: true
      }).filter(file => file.isDirectory()).map(({ name }) => name);

      for (const folder of folders) {
        for (const file of readdirSync(`./Commands/${folder}`, {
          withFileTypes: true
        })) {
          if (file.isDirectory()) {
            commandsCollection.set(file.name, new Collection());

            for (const subfile of readdirSync(`./Commands/${folder}/${file.name}`, {
              withFileTypes: true
            })) {
              if (subfile.name === "index.js") continue;

              if (subfile.isDirectory()) {
                commandsCollection.get(file.name).set(subfile.name, new Collection());

                for (const subsubfile of readdirSync(`./Commands/${folder}/${file.name}/${subfile.name}`)) {
                  if (subsubfile === "index.js") continue;
                  const subsubcommand = new (require(`../Commands/${folder}/${file.name}/${subfile.name}/${subsubfile}`))(this);
                  commandsCollection.get(file.name).get(subfile.name).set(subsubcommand.name, subsubcommand);
                }

                continue;
              }

              const subcommand = new (require(`../Commands/${folder}/${file.name}/${subfile.name}`))(this);
              commandsCollection.get(file.name).set(subcommand.name, subcommand);
            }

            continue;
          }

          const command = new (require(`../Commands/${folder}/${file.name}`))(this);
          commandsCollection.set(command.name, command);
        }
      }

      return commandsCollection;
    })();
    this.FreeBugMail = FreeBugMail;
    this.Invite = Invite;
    this.Verification = Verification;
    this.freeBugMails = new Collection();
    this.invites = new Collection();
  }

  log(message: string, consoleLog: any = message) {
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

  freeBugMailLog(message: string, consoleLog: any = message) {
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

  consoleLog(consoleLog: any, stamp = new Date().toISOString()) {
    console.log(`- - - - - ${stamp} - - - - -`);
    console.log(consoleLog);
  }

  applyCommands() {
    const commands = [];

    const folders = readdirSync(`${__dirname}/../Commands`, {
      withFileTypes: true
    }).filter(file => file.isDirectory()).map(({ name }) => name);

    for (const folder of folders) {
      for (const file of readdirSync(`${__dirname}/../Commands/${folder}`, {
        withFileTypes: true
      })) {
        if (file.isDirectory()) {
          for (const subfile of readdirSync(`${__dirname}/../Commands/${folder}/${file.name}`)) {
            if (subfile !== "index.js") continue;
            commands.push(require(`${__dirname}/../Commands/${folder}/${file.name}/${subfile}`)(this));
          }
        } else commands.push(new (require(`${__dirname}/../Commands/${folder}/${file.name}`))(this).commandData);
      }
    }

    this.guild.commands.set(commands.map(command => command.applicationCommandData)).then(applicationCommands => {
      this.consoleLog(applicationCommands.map(({ name }) => `Set ${name} as a Slash Command.`).join("\n"));
      const permissionPromises = [];

      for (const applicationCommand of applicationCommands.values()) {
        permissionPromises.push(applicationCommand.permissions.set({
          permissions: commands.find(({ applicationCommandData: { name } }) => name === applicationCommand.name).permissions
        }).then(() => this.consoleLog(`Updated the permissions of ${applicationCommand.name}.`)));
      }

      Promise.all(permissionPromises).then(() => this.consoleLog("Finished applying commands!"));
    });
  }

  kanal(channel: string): GuildChannel | ThreadChannel {
    return this.guild.channels.resolve(this.kanaly[channel]);
  }

  role(role: string): Role {
    return this.guild.roles.resolve(this.roles[role]);
  }

  get guild(): Guild {
    return this.guilds.resolve("765611756441436160");
  }

  get bbaGuild(): Guild {
    return this.guilds.resolve("391356859518287895");
  }

  get logChannel(): TextChannel {
    return this.kanal("dtt-bot-log") as TextChannel;
  }

  get freeBugMailLogChannel(): TextChannel {
    return this.kanal("dtt-bot-log") as TextChannel;
  }

  get kanaly(): Record<string, Snowflake> {
    return {
      Information: "765620075737776218",
      "read-me": "765620328511963176",
      verification: "765621889682374656",
      roles: "765706613155430411",
      announcements: "765620353191903303",
      General: "765620128356106271",
      general: "765720809519316992",
      "bot-commands": "765623545631735858",
      starboard: "801239097058263061",
      voice: "847280182997286932",
      "DT General": "803249681391026266",
      a11y: "861691101563846707",
      resources: "773631998970822657",
      "bugmail-queue": "852581876030898176",
      "bugmail-discussion": "852592316438020136",
      "bugmailed-reports": "785830225665458227",
      "Discord Updates": "765633727937380402",
      "dtt-bot-log": "853235554375434270",
      "dtt-bugmail-logs": "853243608828346409",
      "invite-logs": "765676229478711366"
    };
  }

  get roles(): Record<string, Snowflake> {
    return {
      Admin: "765611993532334120",
      "DTT Bot": "765730622302847037",
      bargebot: "765675911432896574",
      "Build Bot": "765633436554625045",
      DUpdate: "765616358019825737",
      starbot: "801238697672048691",
      "DT Mod or BA": "832393264975970306",
      "DT Staff": "776828300450201600",
      Moderator: "815329929838198824",
      DJ: "851574177198899200",
      Muted: "815340396808503367",
      "1st Place": "780624959059132426",
      "2nd Place": "780624987332542465",
      "3rd Place": "780625011605372928",
      Tester: "765638424618074122",
      "Alt Account": "799502317430767647",
      "BW Contributor": "791022460454567947",
      Bot: "765618889316892682",
      "Free BugMail": "852589448070692947",
      Android: "765617891415556106",
      Desktop: "765617904665362472",
      iOS: "765617920134742067",
      DBug: "803250701168934913",
      Boardless: "803327819001364500",
      P0: "868094217958858752",
      "Status Updates": "819294185206972416",
      "Canary Updates": "765633934813823008",
      "PTB Updates": "765633896544206848",
      "Stable Updates": "765619042403745844",
      "macOS El Capitan": "852473203623591936",
      "macOS Sierra": "852473381974048819",
      "macOS High Sierra": "852473425179049985",
      "macOS Mojave": "852473455957114910",
      "macOS Catalina": "852473484956401694",
      "macOS Big Sur": "852473513552904202",
      "macOS Monterey": "852473541956861952",
      Linux: "766339902396301322",
      "Windows 7": "852472935163625493",
      "Windows 8": "852472977105747980",
      "Windows 10": "852473007753527346",
      "Windows 11": "858435618861875212",
      iPhone: "766338561405485106",
      iPod: "766338590337794080",
      iPad: "766338608624828426",
      "iOS 10": "852472437509455904",
      "iOS 11": "852472612344823838",
      "iOS 12": "852472632921292820",
      "iOS 13": "852472643386343434",
      "iOS 14": "852472652333711370",
      "iOS 15": "852472663288578049",
      "Android Alpha": "855118301004431380",
      "Android 5": "852469985163214858",
      "Android 6": "852471384738365480",
      "Android 7": "852471462584385566",
      "Android 8": "852471480495243265",
      "Android 9": "852471492657938442",
      "Android 10": "852471502418083840",
      "Android 11": "852471514904920075",
      "Android 12": "852471524829036544",
      Chromebook: "806742949756796948",
      "Mobile Hardware Keyboard": "766338637368524820",
      "Apple Pencil": "766337433712197642",
      "Apple Watch": "766338782273732649",
      "Touchscreen PC": "766339616944816179",
      GDPR: "818960617972957195",
      Shame: "789692216880660561",
    }
  }
}
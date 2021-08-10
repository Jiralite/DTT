import { CategoryChannel, CommandInteraction, CommandStructure, GuildMember, Message, MessageSelectOptionData, NewsChannel, Role, Snowflake, TextChannel } from "discord.js";
import DTT from "../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "regenerate";
  messageIds: Snowflake[] = [];

  constructor(DTT: DTT) {
    this.DTT = DTT;
  }

  async traditional(interaction: CommandInteraction) {
    const channel = interaction.channel;

    if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
      return interaction.reply({
        content: "This cannot be used in this channel.",
        ephemeral: true
      });
    }

    if (!channel.permissionsFor(interaction.guild!.me as GuildMember).has([
      "VIEW_CHANNEL",
      "SEND_MESSAGES"
    ])) {
      return interaction.reply({
        content: "`VIEW_CHANNEL` & `SEND_MESSAGES` are required to execute this command here.",
        ephemeral: true
      });
    }

    const text = interaction.options.getString("channel_name");

    const message = await interaction.deferReply({
      fetchReply: true
    }) as Message;

    try {
      switch (text) {
        case "read-me":
          await this.readMe(channel);
          break;
        case "roles":
          await this.roles(channel);
          break;
        case "bugmail-queue":
          await this.bugmailQueue(channel);
          break;
      }

      message.delete().catch(() => null);
    } catch (error) {
      this.DTT.log(`Error regenerating "${text}".`, error);
      channel.bulkDelete(this.messageIds);
      interaction.editReply("There was an error regenerating content.");
    }
  }

  async readMe(channel: TextChannel | NewsChannel) {
    const moderator = this.DTT.role("Moderator");
    const Information = this.DTT.kanal("Information") as CategoryChannel;
    const announcements = this.DTT.kanal("announcements");
    const roles = this.DTT.kanal("roles");
    const General = this.DTT.kanal("General") as CategoryChannel;
    const general = this.DTT.kanal("general");
    const botCommands = this.DTT.kanal("bot-commands");
    const DTGeneral = this.DTT.kanal("DT General") as CategoryChannel;
    const a11y = this.DTT.kanal("a11y");
    const resources = this.DTT.kanal("resources");
    const bugmailQueue = this.DTT.kanal("bugmail-queue");
    const bugmailDiscussion = this.DTT.kanal("bugmail-discussion");
    const DiscordUpdates = this.DTT.kanal("Discord Updates") as CategoryChannel;

    if ([moderator, Information, announcements, roles, General, general, botCommands, DTGeneral, a11y, resources, bugmailQueue, bugmailDiscussion, DiscordUpdates].some(variable => variable === null)) {
      throw new ReferenceError("Unknown references detected.");
    }

    const message1 = await channel.send({
      content: `Welcome to **${this.DTT.guild.name}**!\n\nThe purpose of this server is to bring T2+ people together to test Discord! As such, this server is open to those who are currently at least T2 on Discord Testers. Those who fall below this requirement whilst a member will be removed.\n\n**__Rules__**\n1) This server is not endorsed by Discord Testers. Therefore, please do not advertise it on Discord Testers.\n2) Reserved.\n3) Follow Discord's Terms of Service (https://dis.gd/ToS) and Community Guidelines (https://dis.gd/guidelines)\n4) This is not a comprehensive list of rules; anything prohibited in Discord Testers is probably prohibited here. Follow the ${moderator}s' instructions.\n\nRead below for an explanation of categories!\n\n**__${Information.name}__**\nYou are here! This category contains an introduction to the server. This channel also includes ${announcements} and ${roles} which you can view once admitted to the server.\n\n**__${General.name}__**\nHome to ${general} (off-topic chat) and ${botCommands} and other channels which may show up from time to time.\n\n**__${DTGeneral.name}__**\nChannels in this category relate specifically to Discord Testers, such as:\n• ${a11y}\n• ${resources}\n• ${bugmailQueue}\n• ${bugmailDiscussion}\n\n**__Testing Categories__**\nThe purpose of these categories are to test bugs specific to the respective platform. These categories also include information related to the platform from Phabricator. Each category also includes a discussion channel, as well as a channel for known issues. Phabricator channels that aren't specific to a testing category fit into ${DTGeneral.name}.\n\n**__${DiscordUpdates.name}__**\nUpdates are sent when there is a new Stable, PTB or Canary build (or host) available and also for when there is a new status issue recorded on https://dis.gd/status.\n\n**__Invite__**\nThe \`/invite\` Slash Command can be used to generate a one-time invite to this server. Wait a day before inviting a new T2 please.`,
      allowedMentions: {
        parse: []
      }
    });

    await message1.suppressEmbeds();
    this.messageIds.push(message1.id);
  }

  async roles(channel: TextChannel | NewsChannel) {
    const macOSVersionRoles = [
      this.DTT.role("macOS El Capitan"),
      this.DTT.role("macOS Sierra"),
      this.DTT.role("macOS High Sierra"),
      this.DTT.role("macOS Mojave"),
      this.DTT.role("macOS Catalina"),
      this.DTT.role("macOS Big Sur"),
      this.DTT.role("macOS Monterey")
    ];
  
    const linuxDistributionRoles = [
      this.DTT.role("Arch Linux"),
      this.DTT.role("elementary OS"),
      this.DTT.role("Gentoo Linux"),
      this.DTT.role("Linux Mint"),
      this.DTT.role("Manjaro Linux"),
      this.DTT.role("Pop!_OS"),
      this.DTT.role("Ubuntu")
    ];
  
    const windowsVersionRoles = [
      this.DTT.role("Windows 7"),
      this.DTT.role("Windows 8"),
      this.DTT.role("Windows 10"),
      this.DTT.role("Windows 11")
    ];
  
    const androidDeviceRoles = [
      this.DTT.role("Pixel"),
      this.DTT.role("Razer Phone"),
      this.DTT.role("Samsung Galaxy")
    ];
  
    const androidVersionRoles = [
      this.DTT.role("Android 5"),
      this.DTT.role("Android 6"),
      this.DTT.role("Android 7"),
      this.DTT.role("Android 8"),
      this.DTT.role("Android 9"),
      this.DTT.role("Android 10"),
      this.DTT.role("Android 11"),
      this.DTT.role("Android 12")
    ];
  
    const iOSDeviceRoles = [
      this.DTT.role("iPhone"),
      this.DTT.role("iPod"),
      this.DTT.role("iPad")
    ];
  
    const iOSVersionRoles = [
      this.DTT.role("iOS 10"),
      this.DTT.role("iOS 11"),
      this.DTT.role("iOS 12"),
      this.DTT.role("iOS 13"),
      this.DTT.role("iOS 14"),
      this.DTT.role("iOS 15"),
    ];
  
    const iOSMiscellaneousRoles = [
      this.DTT.role("Face ID"),
      this.DTT.role("4-inch"),
      this.DTT.role("Hardware Keyboard"),
      this.DTT.role("Apple Pencil"),
      this.DTT.role("Apple Watch")
    ];

    const chromebook = this.DTT.role("Chromebook") as Role;
  
    const miscellaneousRoles = [
      this.DTT.role("Touchscreen PC"),
      this.DTT.role("GDPR")
    ];
  
    const experimentRoles = [
      this.DTT.role("Student")
    ];
  
    const discordUpdatesRoles = [
      this.DTT.role("Status Updates"),
      this.DTT.role("Canary Updates"),
      this.DTT.role("PTB Updates"),
      this.DTT.role("Stable Updates")
    ];
  
    const phabricatorUpdatesRoles = [
      this.DTT.role("Desktop"),
      this.DTT.role("Android"),
      this.DTT.role("iOS"),
      this.DTT.role("DBug"),
      this.DTT.role("Boardless"),
      this.DTT.role("P0")
    ];

    if ([...macOSVersionRoles, ...linuxDistributionRoles, ...windowsVersionRoles, ...androidDeviceRoles, ...androidVersionRoles, ...iOSDeviceRoles, ...iOSVersionRoles, ...iOSMiscellaneousRoles, chromebook, ...miscellaneousRoles, ...experimentRoles, ...discordUpdatesRoles, ...phabricatorUpdatesRoles].some(variable => variable === null)) {
      throw new ReferenceError("Unknown references detected.");
    }
    
    const options = (componentOptions: Role[]): MessageSelectOptionData[] => componentOptions.map(({ id, name }) => ({
      label: name,
      value: id
    }));

    await channel.send({
      content: "**__macOS__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign macOS version roles!",
              minValues: 0,
              maxValues: macOSVersionRoles.length,
              options: options(macOSVersionRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Linux__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Linux distribution roles!",
              minValues: 0,
              maxValues: linuxDistributionRoles.length,
              options: options(linuxDistributionRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Windows__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Windows version roles!",
              minValues: 0,
              maxValues: windowsVersionRoles.length,
              options: options(windowsVersionRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Android__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Android device roles!",
              minValues: 0,
              maxValues: androidDeviceRoles.length,
              options: options(androidDeviceRoles as Role[])
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Android version roles!",
              minValues: 0,
              maxValues: androidVersionRoles.length,
              options: options(androidVersionRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__iOS__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign iOS device roles!",
              minValues: 0,
              maxValues: iOSDeviceRoles.length,
              options: options(iOSDeviceRoles as Role[])
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign iOS version roles!",
              minValues: 0,
              maxValues: iOSVersionRoles.length,
              options: options(iOSVersionRoles as Role[])
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign miscellanous iOS info!",
              minValues: 0,
              maxValues: iOSMiscellaneousRoles.length,
              options: options(iOSMiscellaneousRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Chrome OS__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: chromebook.name,
              customId: `SELFROLE-${chromebook.id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Miscellaneous__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign miscellanous roles!",
              minValues: 0,
              maxValues: miscellaneousRoles.length,
              options: options(miscellaneousRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Experiments__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Experiment roles!",
              minValues: 0,
              maxValues: experimentRoles.length,
              options: options(experimentRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send("There are also other roles we use for notifying purposes. Check them out!");

    await channel.send({
      content: "**__Discord Updates__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Experiment roles!",
              minValues: 0,
              maxValues: discordUpdatesRoles.length,
              options: options(discordUpdatesRoles as Role[])
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Phabricator Updates__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE",
              placeholder: "Assign Experiment roles!",
              minValues: 0,
              maxValues: phabricatorUpdatesRoles.length,
              options: options(phabricatorUpdatesRoles as Role[])
            }
          ]
        }
      ]
    });
  }

  async bugmailQueue(channel: TextChannel | NewsChannel) {
    if (!channel.permissionsFor(this.DTT.guild.me as GuildMember).has("MANAGE_MESSAGES")) throw new Error("Msising permissions");
    const freeBugMail = this.DTT.role("Free BugMail");
    const typing = this.DTT.emodzhi("typing");
    const bugmailedReports = this.DTT.kanal("bugmailed-reports");
    const bugmailedDiscussion = this.DTT.kanal("bugmail-discussion");

    if ([freeBugMail, typing, bugmailedReports, bugmailedDiscussion].some(variable => variable === null)) {
      throw new ReferenceError("Unknown references detected.");
    }

    const message1 = await channel.send({
      content: `Oh no! Do you need to BugMail something, but your BugMail isn't free? There's still hope!\n\nYou can drop your question in here via the \`/free-bugmail\` submit Application Command and wait for someone to claim your question! Those with a ${freeBugMail} can claim a request by then clicking on the "Claim" button. This lets others know that the query has been BugMailed via the ${typing} reaction.\n\n⚠️ **Important**: Make sure you do background checks in <#733499719267123200> and ${bugmailedReports} etc. to ensure that the query isn't already BugMailed. Once you are sure it isn't in BugMail, claim first _then_ BugMail.\n\nOnce claimed, make sure to follow up with the BugMail responses in ${bugmailedDiscussion}!\n\n📝 If a request has not been claimed for an hour, the ${freeBugMail} role will be mentioned!\n\nFinally, once the request is complete, you can use the \`/free-bugmail complete\` Application Command to complete it!\n\nAlso, this is an opt-in feature, so here's 2 buttons to opt in & opt out for the ${freeBugMail} role!`,
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Opt in",
              customId: "Free BugMail",
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Opt out",
              customId: "No Free BugMail",
              style: "SECONDARY"
            }
          ]
        }
      ],
      allowedMentions: {
        parse: []
      }
    });

    await message1.pin();
    this.messageIds.push(message1.id);
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: "regenerate",
        description: "Regenerates a channel's information.",
        options: [
          {
            type: "STRING",
            name: "channel_name",
            description: "Name of the channel to regenerate.",
            required: true,
            choices: [
              {
                name: "Roles",
                value: "roles"
              },
              {
                name: "Read Me",
                value: "read-me"
              },
              {
                name: "BugMail Queue",
                value: "bugmail-queue"
              }
            ]
          }
        ],
        defaultPermission: false
      },
      permissions: [
        {
          id: (this.DTT.role("Admin") as Role).id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}
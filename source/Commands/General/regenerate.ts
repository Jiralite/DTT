import { CategoryChannel, CommandInteraction, CommandStructure, GuildMember, Message, NewsChannel, Role, Snowflake, TextChannel } from "discord.js";
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
    this.messageIds = [];

    const message = await interaction.deferReply({
      fetchReply: true
    }) as Message;

    try {
      switch (text) {
        case "read-me":
          await this.readMe(channel);
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
    const General = this.DTT.kanal("General") as CategoryChannel;
    const general = this.DTT.kanal("general");
    const botCommands = this.DTT.kanal("bot-commands");
    const Feedback = this.DTT.kanal("Feedback") as CategoryChannel;
    const DTGeneral = this.DTT.kanal("DT General") as CategoryChannel;
    const a11y = this.DTT.kanal("a11y");
    const resources = this.DTT.kanal("resources");
    const bugmailQueue = this.DTT.kanal("bugmail-queue");
    const bugmailDiscussion = this.DTT.kanal("bugmail-discussion");
    const DiscordUpdates = this.DTT.kanal("Discord Updates") as CategoryChannel;

    if ([moderator, Information, announcements, General, general, Feedback, botCommands, DTGeneral, a11y, resources, bugmailQueue, bugmailDiscussion, DiscordUpdates].some(variable => variable === null)) {
      throw new ReferenceError("Unknown references detected.");
    }

    const message1 = await channel.send({
      content: `Welcome to **${this.DTT.guild.name}**!\n\nThe purpose of this server is to bring T2+ people together to test Discord! As such, this server is open to those who are currently at least T2 on Discord Testers. Those who fall below this requirement whilst a member will be removed.\n\n**__Rules__**\n1) This server is not endorsed by Discord Testers. Therefore, please do not advertise it on Discord Testers.\n2) Reserved.\n3) Follow Discord's Terms of Service (https://dis.gd/ToS) and Community Guidelines (https://dis.gd/guidelines)\n4) This is not a comprehensive list of rules; anything prohibited in Discord Testers is probably prohibited here. Follow the ${moderator}s' instructions.\n\nRead below for an explanation of categories!`,
      allowedMentions: {
        parse: []
      }
    });

    await message1.suppressEmbeds();
    const message2 = await channel.send(`**__${Information.name}__**\nYou are here! This category contains an introduction to the server. This channel also includes ${announcements} and ${roles} which you can view once admitted to the server.\n\n**__${General.name}__**\nHome to ${general} (off-topic chat) and ${botCommands} and other channels which may show up from time to time.\n\n**__${Feedback.name}__**\nSelf-explanatory - this category contains feedback channels.\n\n**__${DTGeneral.name}__**\nChannels in this category relate specifically to Discord Testers, such as:\n• ${a11y}\n• ${resources}\n• ${bugmailQueue}\n• ${bugmailDiscussion}\n\n**__Testing Categories__**\nThe purpose of these categories are to test bugs specific to the respective platform. These categories also include information related to the platform from Phabricator. Each category also includes a discussion channel, as well as a channel for known issues. Phabricator channels that aren't specific to a testing category fit into ${DTGeneral.name}.\n\n**__${DiscordUpdates.name}__**\nUpdates are sent when there is a new Stable, PTB or Canary build (or host) available and also for when there is a new status issue recorded on https://dis.gd/status.\n\n**__Roles__**\nThe \`/roles\` slash command can be used to self-assign roles. Please self-assign roles to help identify testers!\n\n**__Invite__**\nThe \`/invite\` slash command can be used to generate a one-time invite to this server. Wait a day before inviting a new T2 please.`);
    this.messageIds.push(message1.id, message2.id);
  }

  async bugmailQueue(channel: TextChannel | NewsChannel) {
    if (!channel.permissionsFor(this.DTT.guild.me as GuildMember).has("MANAGE_MESSAGES")) throw new Error("Missing permissions");
    const freeBugMail = this.DTT.role("Free BugMail");
    const typing = this.DTT.emodzhi("typing");
    const bugmailedReports = this.DTT.kanal("bugmailed-reports");
    const bugmailedDiscussion = this.DTT.kanal("bugmail-discussion");

    if ([freeBugMail, typing, bugmailedReports, bugmailedDiscussion].some(variable => variable === null)) {
      throw new ReferenceError("Unknown references detected.");
    }

    const message1 = await channel.send({
      content: `Oh no! Do you need to BugMail something, but your BugMail isn't free? There's still hope!\n\nYou can drop your question in here via the \`/free-bugmail submit\` Application Command and wait for someone to claim your question! Those with a ${freeBugMail} can claim a request by then clicking on the "Claim" button. This lets others know that the query has been BugMailed via the ${typing} reaction.\n\n⚠️ **Important**: Make sure you do background checks in <#733499719267123200> and ${bugmailedReports} etc. to ensure that the query isn't already BugMailed. Once you are sure it isn't in BugMail, claim first _then_ BugMail.\n\nOnce claimed, make sure to follow up with the BugMail responses in ${bugmailedDiscussion}!\n\n📝 If a request has not been claimed for an hour, the ${freeBugMail} role will be mentioned!\n\nFinally, once the request is complete, you can use the \`/free-bugmail complete\` Application Command to complete it!\n\nAlso, this is an opt-in feature, so here's 2 buttons to opt in & opt out for the ${freeBugMail} role!`,
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
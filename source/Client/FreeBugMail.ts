import { ButtonInteraction, Collection, CommandInteraction, Constants, DiscordAPIError, Formatters, Message, MessageActionRow, MessageButton, MessageEmbed, Role, Snowflake, TextChannel } from "discord.js";
import DTT, { Maria } from "./Client.js";

interface FreeBugMailData {
  No: number;
  Timestamp: number;
  "Weekly Timestamp": number;
  "Message ID": Snowflake;
  "User ID": Snowflake;
  "Claimed By ID": Snowflake | null;
  Mentioned: boolean;
  State: FreeBugMailState;
}

type FreeBugMailCreateData = Omit<FreeBugMailData, "Claimed By ID">;
type FreeBugMailState = "OPEN" | "PENDING" | "DISABLED" | "RESOLVED";

export default class FreeBugMail {
  static readonly cache = new Collection<number, FreeBugMail>();
  readonly No: FreeBugMailData["No"];
  readonly timestamp: FreeBugMailData["Timestamp"];
  weeklyTimestamp: FreeBugMailData["Weekly Timestamp"];
  readonly messageId: FreeBugMailData["Message ID"];
  readonly userId: FreeBugMailData["User ID"];
  claimedById: FreeBugMailData["Claimed By ID"];
  mentioned: FreeBugMailData["Mentioned"];
  state: FreeBugMailData["State"];
  disabledMessageId: Snowflake | null = null;
  hourTimeout: NodeJS.Timeout | null = null;
  reminderTimeout: NodeJS.Timeout | null = null;

  constructor(freeBugMail: FreeBugMailData | FreeBugMailCreateData) {
    this.No = freeBugMail.No;
    this.timestamp = freeBugMail.Timestamp;
    this.weeklyTimestamp = freeBugMail["Weekly Timestamp"];
    this.messageId = freeBugMail["Message ID"];
    this.userId = freeBugMail["User ID"];
    this.claimedById = "Claimed By ID" in freeBugMail ? freeBugMail["Claimed By ID"] : null;
    this.mentioned = Boolean(freeBugMail.Mentioned);
    this.state = freeBugMail.State;
  }

  static async create(interaction: CommandInteraction<"cached">, text: string, messageId: FreeBugMail["messageId"]): Promise<void> {
    const { insertId } = await Maria.query("INSERT INTO `Free BugMails` SET `Timestamp` = ?, `Weekly Timestamp` = ?, `Message ID` = ?, `User ID` = ?, `Mentioned` = ?, `State` = ?;", [
      interaction.createdTimestamp,
      interaction.createdTimestamp,
      messageId,
      interaction.user.id,
      false,
      "OPEN"
    ]);

    const newFreeBugMail = new FreeBugMail({
      No: insertId,
      Timestamp: interaction.createdTimestamp,
      "Weekly Timestamp": interaction.createdTimestamp,
      "Message ID": messageId,
      "User ID": interaction.user.id,
      Mentioned: false,
      State: "OPEN"
    });

    FreeBugMail.cache.set(newFreeBugMail.No, newFreeBugMail);
    const actionRow = new MessageActionRow();
    const button = new MessageButton();
    button.setCustomId(`${newFreeBugMail.No}-PRECLAIM`);
    button.setLabel("Claim");
    button.setStyle(Constants.MessageButtonStyles.PRIMARY);
    actionRow.addComponents(button);
    const embed = new MessageEmbed();
    embed.setAuthor(interaction.user.tag, interaction.member.displayAvatarURL({ format: "png", dynamic: true }));
    embed.setColor((await DTT.guild.members.fetch(DTT.user.id)).displayColor);
    embed.setDescription(text);
    embed.setFooter(`#${newFreeBugMail.No}`);
    embed.setTimestamp();
    DTT.freeBugMailLog(`${interaction.user} created Free BugMail request #${newFreeBugMail.No}.\n\n${text}`);

    await interaction.editReply({
      components: [
        actionRow
      ],
      embeds: [
        embed
      ]
    });

    newFreeBugMail.mentionedTimeout();
  }

  mentionedTimeout(): void {
    this.hourTimeout = setTimeout(async () => {
      await this.bugmailDiscussion.send({
        allowedMentions: {
          parse: [
            "roles"
          ]
        },
        content: `Hey, is anyone with a ${this.freeBugMail} able to help with Free BugMail request #${this.No} belonging to ${Formatters.userMention(this.userId)}?`
      });

      this.mentioned = true;

      await Maria.query("UPDATE `Free BugMails` SET `Mentioned` = ? WHERE `No` = ?;", [
        true,
        this.No
      ]);

      if (this.hourTimeout !== null) {
        clearTimeout(this.hourTimeout);
        this.hourTimeout = null;
      }
    }, 3600000 - (Date.now() - this.timestamp));
  }

  weeklyTimeout(): void {
    if (!this.isPending()) throw new Error(`Attempted to start a weekly timeout for Free BugMail request #${this.No}, but the state was not "PENDING".`);

    this.reminderTimeout = setTimeout(claimedById => {
      const actionRow = new MessageActionRow();
      const button = new MessageButton();
      const button2 = new MessageButton();
      button.setCustomId(`${this.No}-PENDING`);
      button.setLabel("Yes");
      button.setStyle(Constants.MessageButtonStyles.PRIMARY);
      button2.setCustomId(`${this.No}-RESOLVED`);
      button2.setLabel("No");
      button2.setStyle(Constants.MessageButtonStyles.SECONDARY);
      actionRow.addComponents(button, button2);

      this.bugmailDiscussion.send({
        components: [
          actionRow
        ],
        content: `Hey, ${Formatters.userMention(claimedById)}. It's been a week. Is Free BugMail request #${this.No} still ongoing?`
      });
    }, 604800000 - (Date.now() - this.weeklyTimestamp), this.claimedById);
  }

  async resumePendingTimeout(interaction: ButtonInteraction<"cached">): Promise<void> {
    if (!this.isPending()) throw new Error(`Attempted to resume from a weekly timeout for Free BugMail request #${this.No}, but the state was not "PENDING".`);
    DTT.freeBugMailLog(`${interaction.user} has stated Free BugMail request #${this.No} is still ongoing after a week.`);

    await Maria.query("UPDATE `Free BugMails` SET `Weekly Timestamp` = ? WHERE `No` = ?;", [
      interaction.createdTimestamp,
      this.No
    ]);

    this.weeklyTimestamp = interaction.createdTimestamp;

    await interaction.update({
      components: [],
      content: `You've stated that the BugMail is still ongoing, ${Formatters.userMention(this.claimedById)}. Ongoing it remains!`
    });

    this.weeklyTimeout();
  }

  async resolvePendingTimeout(interaction: ButtonInteraction<"cached">): Promise<void> {
    if (!this.isPending()) throw new Error(`Attempted to resolve from a weekly timeout for Free BugMail request #${this.No}, but the state was not "PENDING".`);
    DTT.freeBugMailLog(`${interaction.user} stated has stated Free BugMail request #${this.No} has been completed after a weekly reminder.`);

    await interaction.update({
      components: [],
      content: `You've stated that Free BugMail request #${this.No} has been completed, ${Formatters.userMention(this.claimedById)}. Completed it be!`
    });

    await this.resolve(interaction, true);
  }

  async preClaim(interaction: ButtonInteraction<"cached">): Promise<void> {
    const freeBugMail = FreeBugMail.cache.find(freeBugMail => freeBugMail.claimedById === interaction.user.id && freeBugMail.isPending());

    if (freeBugMail) {
      DTT.freeBugMailLog(`${interaction.user} attempted to claim Free BugMail request #${this.No} but already has a pending BugMail (#${freeBugMail.No}).`);

      return await interaction.reply({
        content: `You seem to already have claimed a pending Free BugMail request for ${Formatters.userMention(freeBugMail.userId)}: [#${freeBugMail.No}](${freeBugMail.messageLink})`,
        ephemeral: true
      });
    }

    interaction.component.setDisabled();
    await interaction.message.edit({ components: interaction.message.components });
    DTT.freeBugMailLog(`${interaction.user} is attempting to claim Free BugMail request #${this.No} and is being asked to double check before fully claiming.`);
    const actionRow = new MessageActionRow();
    const button = new MessageButton();
    const button2 = new MessageButton();
    button.setCustomId(`${this.No}-CLAIM`);
    button.setLabel("Yes! Claim!");
    button.setStyle(Constants.MessageButtonStyles.SUCCESS);
    button2.setCustomId(`${this.No}-BUGMAILED`);
    button2.setLabel("Oops! It's BugMailed!");
    button2.setStyle(Constants.MessageButtonStyles.DANGER);
    actionRow.addComponents(button, button2);

    const message = await interaction.reply({
      components: [
        actionRow
      ],
      content: "⚠️ Have you searched in Discord Testers (specifically <#733499719267123200>) to ensure that this isn't already BugMailed?",
      ephemeral: true,
      fetchReply: true
    });

    try {
      const awaitedInteraction = await message.awaitMessageComponent({ componentType: "BUTTON", time: 60000 });

      if (awaitedInteraction.component.customId === `${this.No}-CLAIM`) return this.claim(awaitedInteraction);
      this.alreadyBugMailed(awaitedInteraction);
    } catch {
      DTT.freeBugMailLog(`${interaction.user} did not fully claim Free BugMail request #${this.No}.`);
      interaction.component.setDisabled(false);
      interaction.message.edit({ components: interaction.message.components });

      interaction.editReply({
        components: [],
        content: "Interaction took too long - the claim button is now free again!"
      });
    }
  }

  async claim(interaction: ButtonInteraction<"cached">): Promise<void> {
    await Maria.query("UPDATE `Free BugMails` SET `Claimed By ID` = ?, `State` = ? WHERE `No` = ?;", [
      interaction.user.id,
      "PENDING",
      this.No
    ]);

    this.claimedById = interaction.user.id;
    this.state = "PENDING";
    const message = await this.fetchMessage();

    message.embeds[0].spliceFields(0, 1, {
      name: "Notes",
      value: `Claimed by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), Formatters.TimestampStyles.RelativeTime)}`,
      inline: false
    });

    await message.edit({
      components: [],
      embeds: [
        message.embeds[0]
      ]
    });

    await message.react(DTT.emoji("typing"));
    const guildMember = interaction.member;
    if (guildMember.roles.cache.has(this.freeBugMail.id)) await guildMember.roles.remove(this.freeBugMail);
    DTT.freeBugMailLog(`${interaction.user} successfully claimed Free BugMail request #${this.No}.`);

    await this.bugmailDiscussion.send({
      content: `${interaction.user} has just claimed the Free BugMail request of ${Formatters.userMention(this.userId)}.\nBe sure to post in <#733499719267123200> and ${DTT.channel("bugmailed-reports")} for clarity!`,
      embeds: message.embeds
    });

    await interaction.update({
      components: [],
      content: `You have successfully claimed Free BugMail request [#${this.No}](${this.messageLink}) belonging to ${Formatters.userMention(this.userId)}!`
    });

    if (this.hourTimeout !== null) {
      clearTimeout(this.hourTimeout);
      this.hourTimeout = null;
    }

    this.weeklyTimeout();
  }

  async edit(interaction: CommandInteraction<"cached">, text: string): Promise<void> {
    const message = await this.fetchMessage();
    message.embeds[0].setDescription(text);
    await message.edit({ embeds: message.embeds });
    DTT.freeBugMailLog(`${interaction.user} edited Free BugMail request #${this.No}.\n\n${text}`);

    return await interaction.reply({
      content: `Successfully edited Free BugMail request #${this.No}!`,
      ephemeral: true
    });
  }

  async resolve(interaction: ButtonInteraction<"cached"> | CommandInteraction<"cached">, fromWeeklyTimeout: boolean): Promise<void> {
    await Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ]);

    this.state = "RESOLVED";

    if (this.reminderTimeout !== null) {
      clearTimeout(this.reminderTimeout);
      this.reminderTimeout = null;
    }

    const message = await this.fetchMessage();

    if (!fromWeeklyTimeout) {
      await interaction.reply({
        content: `You have completed Free BugMail request #${this.No} belonging to ${Formatters.userMention(this.userId)}!`,
        ephemeral: true
      });
    }

    if (!interaction.member.roles.cache.has(this.freeBugMail.id)) interaction.member.roles.add(this.freeBugMail);

    await this.bugmailDiscussion.send({
      content: `${interaction.user} has completed the Free BugMail request of ${Formatters.userMention(this.userId)}!\nThe ${this.freeBugMail} role has been added to you!`,
      embeds: message.embeds,
      allowedMentions: {
        parse: [
          "users"
        ]
      }
    });

    DTT.freeBugMailLog(`${interaction.user} has completed Free BugMail request #${this.No}!`);
    await message.delete();
  }

  async remove(): Promise<void> {
    if (this.hourTimeout !== null) {
      clearTimeout(this.hourTimeout);
      this.hourTimeout = null;
    }

    if (this.reminderTimeout !== null) {
      clearTimeout(this.reminderTimeout);
      this.reminderTimeout = null;
    }

    DTT.freeBugMailLog(`Free BugMail request #${this.No} has been manually deleted and ergo automatically resolved.`);

    await Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ]);

    this.state = "RESOLVED";

    if (this.disabledMessageId) {
      await this.bugmailDiscussion.messages.edit(this.disabledMessageId, {
        components: []
      }).catch(() => null);
    }
  }

  async alreadyBugMailed(interaction: ButtonInteraction<"cached">): Promise<void> {
    const message = await this.fetchMessage();
    message.components[0].components[0].setDisabled();

    message.embeds[0].spliceFields(0, 1, {
      name: "Notes",
      value: `Disabled by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), Formatters.TimestampStyles.RelativeTime)}`,
      inline: false
    });

    await message.edit({ components: message.components, embeds: message.embeds });

    await Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "DISABLED",
      this.No
    ]);

    this.state = "DISABLED";
    DTT.freeBugMailLog(`${interaction.user} has specified Free BugMail request #${this.No} as already claimed.`);
    const actionRow = new MessageActionRow();
    const button = new MessageButton();
    button.setCustomId(`${this.No}-RESTORE`);
    button.setLabel("Restore");
    button.setStyle(Constants.MessageButtonStyles.PRIMARY);
    actionRow.addComponents(button);

    const { id } = await this.bugmailDiscussion.send({
      components: [
        actionRow
      ],
      content: `Free BugMail request #${this.No} has been specified as already BugMailed. It is now pending deletion.`,
      embeds: message.embeds
    });

    this.disabledMessageId = id;

    await interaction.update({
      components: [],
      content: `You have marked Free BugMail request [#${this.No}](${this.messageLink}) as already BugMailed.`
    });
  }

  async restore(interaction: ButtonInteraction<"cached">): Promise<void> {
    if (this.isResolved()) {
      await interaction.message.edit({ components: [] });
      DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but the Free BugMail request was already resolved. The button has now been removed.`);

      return await interaction.reply({
        content: `Free BugMail request #${this.No} is already resolved. The button has now been removed.`,
        ephemeral: true
      });
    }

    if (!interaction.member.roles.cache.hasAny(...DTT.modRoles.map(modRole => modRole.id))) {
      DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but failed authorisation checks.`);

      return await interaction.reply({
        content: "You do not have permission to perform this interaction.",
        ephemeral: true
      });
    }

    try {
      const message = await this.fetchMessage();

      Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
        "OPEN",
        this.No
      ]);

      this.state = "OPEN";
      message.components[0].components[0].setDisabled(false);
      message.embeds[0].fields = [];
      await message.edit({ components: message.components, embeds: message.embeds });
      await interaction.message.edit({ components: [] });
      DTT.freeBugMailLog(`${interaction.user} restored Free BugMail request #${this.No}!`);
      return await interaction.reply(`Free BugMail request [#${this.No}](${this.messageLink}) has been restored.`);
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE) {
          await interaction.message.edit({ components: [] });
          DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but the Free BugMail request was not found. The button has now been removed.`);

          return await interaction.reply({
            content: `Apparently, Free BugMail request #${this.No} no longer exists. The button has now been removed.`,
            ephemeral: true
          });
        }
      }

      DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but encountered an error.`, error);

      return await interaction.reply({
        content: "There was an error restoring this Free BugMail request.",
        ephemeral: true
      });
    }
  }

  fetchMessage(): Promise<Message> {
    return this.bugmailQueue.messages.fetch(this.messageId);
  }

  isOpen(): this is this & { claimedById: null, state: "OPEN" } {
    return this.state === "OPEN";
  }

  isPending(): this is this & { claimedById: Snowflake, state: "PENDING" } {
    return this.state === "PENDING";
  }

  isDisabled(): this is this & { claimedById: null, state: "DISABLED" } {
    return this.state === "DISABLED";
  }

  isResolved(): this is this & { state: "RESOLVED" } {
    return this.state === "RESOLVED";
  }

  get bugmailQueue(): TextChannel {
    return DTT.channel("bugmail-queue") as TextChannel;
  }

  get bugmailDiscussion(): TextChannel {
    return DTT.channel("bugmail-discussion") as TextChannel;
  }

  get freeBugMail(): Role {
    return DTT.role("Free BugMail");
  }

  get messageLink(): `https://discord.com/channels/${typeof DTT.guild.id}/${typeof this.bugmailQueue.id}/${typeof this.messageId}` {
    return `https://discord.com/channels/${DTT.guild.id}/${this.bugmailQueue.id}/${this.messageId}`;
  }

  static addRole(interaction: ButtonInteraction<"cached">): void {
    const logText = `${interaction.user} interacted with the "Opt in" button.`;
    const freeBugMail = DTT.role("Free BugMail");

    if (interaction.member.roles.cache.has(freeBugMail.id)) {
      DTT.freeBugMailLog(`${logText} ${freeBugMail} already exists on account.`);

      interaction.reply({
        content: `You already have the ${freeBugMail} role.`,
        ephemeral: true
      });

      return;
    }

    interaction.member.roles.add(freeBugMail).then(() => {
      DTT.freeBugMailLog(`${logText} ${freeBugMail} added to account.`);

      interaction.reply({
        content: `The ${freeBugMail} role has been added to you!`,
        ephemeral: true
      });
    }).catch(error => {
      DTT.freeBugMailLog(`${logText} Error in ${freeBugMail} addition.`, error);

      interaction.reply({
        content: "There was an error during self-role addition.",
        ephemeral: true
      });
    });
  }

  static removeRole(interaction: ButtonInteraction<"cached">): void {
    const logText = `${interaction.user} interacted with the "Opt out" button.`;
    const freeBugMail = DTT.role("Free BugMail");

    if (!interaction.member.roles.cache.has(freeBugMail.id)) {
      DTT.freeBugMailLog(`${logText} ${freeBugMail} does not already exist on account.`);

      interaction.reply({
        content: `You do not already have the ${freeBugMail} role.`,
        ephemeral: true
      });

      return;
    }

    interaction.member.roles.remove(freeBugMail).then(() => {
      DTT.freeBugMailLog(`${logText} ${freeBugMail} removed from account.`);

      interaction.reply({
        content: `The ${freeBugMail} role has been removed from you!`,
        ephemeral: true
      });
    }).catch(error => {
      DTT.freeBugMailLog(`${logText} Error in ${freeBugMail} removal.`, error);

      interaction.reply({
        content: "There was an error during self-role removal.",
        ephemeral: true
      });
    });
  }
}

import { ButtonInteraction, CommandInteraction, Constants, DiscordAPIError, Formatters, FreeBugMailData, FreeBugMailState, GuildMember, Message, MessageButton, Role, Snowflake, TextChannel } from "discord.js";
import DTT from "./Client.js";

export default class FreeBugMail {
  No: number | null;
  timestamp: number;
  weeklyTimestamp: number;
  messageId: Snowflake;
  userId: Snowflake;
  claimedById: Snowflake | null;
  mentioned: boolean;
  state: FreeBugMailState | null;
  disabledMessageId: Snowflake | null;
  hourTimeout: NodeJS.Timeout | null;
  reminderTimeout: NodeJS.Timeout | null;
  pendingDeletion: boolean;

  constructor(freeBugMail: FreeBugMailData) {
    this.No = freeBugMail.No;
    this.timestamp = +freeBugMail.Timestamp;
    this.weeklyTimestamp = +freeBugMail["Weekly Timestamp"];
    this.messageId = freeBugMail["Message ID"];
    this.userId = freeBugMail["User ID"];
    this.claimedById = freeBugMail["Claimed By ID"];
    this.mentioned = Boolean(freeBugMail.Mentioned);
    this.state = freeBugMail.State;
    this.disabledMessageId = null;
    this.hourTimeout = null;
    this.reminderTimeout = null;
    this.pendingDeletion = false;
  }

  async create(interaction: CommandInteraction, text: string): Promise<void> {
    const { insertId } = await DTT.Maria.query("INSERT INTO `Free BugMails` SET `Timestamp` = ?, `Weekly Timestamp` = ?, `Message ID` = ?, `User ID` = ?, `Mentioned` = ?, `State` = ?;", [
      this.timestamp,
      this.weeklyTimestamp,
      this.messageId,
      this.userId,
      this.mentioned,
      this.state
    ]);

    this.No = insertId;
    this.mentioned = false;
    this.state = "OPEN";
    this.mentionedTimeout();
    DTT.freeBugMails.set(insertId, this);
    const me = await DTT.guild.members.fetch(DTT.user.id);

    await interaction.editReply({
      embeds: [
        {
          description: text,
          timestamp: Date.now(),
          color: me.displayColor,
          footer: {
            text: `#${this.No}`
          },
          author: {
            name: interaction.user.tag,
            icon_url: interaction.user.displayAvatarURL({
              format: "png",
              dynamic: true
            })
          }
        }
      ],
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Claim",
              customId: `${this.No}-PRECLAIM`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    DTT.freeBugMailLog(`${interaction.user} created Free BugMail request #${this.No}.\n\n${text}`);
  }

  mentionedTimeout(): void {
    if (this.state !== "OPEN" || this.mentioned) return;
    if (this.hourTimeout !== null) clearTimeout(this.hourTimeout);

    this.hourTimeout = setTimeout(() => this.bugmailDiscussion.send({
      content: `Hey, is anyone with a ${this.freeBugMail} able to help with Free BugMail request #${this.No} belonging to <@${this.userId}>?`,
      allowedMentions: {
        parse: [
          "roles"
        ]
      }
    }).then(() => DTT.Maria.query("UPDATE `Free BugMails` SET `Mentioned` = ? WHERE `No` = ?;", [
      true,
      this.No
    ])), 3600000 - (Date.now() - this.timestamp));
  }

  timeout(): void {
    if (this.state !== "PENDING") return;
    if (this.reminderTimeout !== null) clearTimeout(this.reminderTimeout);

    this.reminderTimeout = setTimeout(() => this.bugmailDiscussion.send({
      content: `Hey, <@${this.claimedById}>. It's been a week. Is Free BugMail request #${this.No} still ongoing?`,
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Yes",
              customId: `${this.No}-PENDING`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "No",
              customId: `${this.No}-RESOLVED`,
              style: "SECONDARY"
            }
          ]
        }
      ]
    }), 604800000 - (Date.now() - this.weeklyTimestamp));
  }

  async resumePendingTimeout(interaction: ButtonInteraction): Promise<void> {
    DTT.freeBugMailLog(`${interaction.user} has stated Free BugMail request #${this.No} is still ongoing after a week.`);

    await DTT.Maria.query("UPDATE `Free BugMails` SET `Weekly Timestamp` = ? WHERE `No` = ?;", [
      Date.now(),
      this.No
    ]);

    this.weeklyTimestamp = Date.now();

    await interaction.update({
      content: `You've stated that the BugMail is still ongoing, <@${this.claimedById}>. Ongoing it remains!`,
      components: []
    });

    this.timeout();
  }

  async resolvePendingTimeout(interaction: ButtonInteraction): Promise<void> {
    DTT.freeBugMailLog(`${interaction.user} stated has stated Free BugMail request #${this.No} has been completed after a weekly reminder.`);

    await interaction.update({
      content: `You've stated that Free BugMail request #${this.No} has been completed, <@${this.claimedById}>. Completed it be!`,
      components: []
    });

    await this.resolve(interaction, true);
  }

  async preClaim(interaction: ButtonInteraction): Promise<void> {
    const interactionMessage = interaction.message as Message;
    const interactionComponent = interaction.component as MessageButton;
    const pendingBugMail = DTT.freeBugMails.find(({ claimedById, state }) => claimedById === interaction.user.id && state === "PENDING");

    if (pendingBugMail) {
      DTT.freeBugMailLog(`${interaction.user} attempted to claim Free BugMail request #${this.No} but already has a pending BugMail (#${pendingBugMail.No}).`);

      return await interaction.reply({
        content: `You seem to already have claimed a pending Free BugMail request for <@${pendingBugMail.userId}>: [#${pendingBugMail.No}](${pendingBugMail.messageLink})`,
        ephemeral: true
      });
    }

    await interactionMessage.edit({
      components: [
        {
          type: "ACTION_ROW",
          components: [
            interactionComponent.setDisabled()
          ]
        }
      ]
    });

    DTT.freeBugMailLog(`${interaction.user} is attempting to claim Free BugMail request #${this.No} and is being asked to double check before fully claiming.`);

    await interaction.reply({
      content: "⚠️ Have you searched in Discord Testers (specifically <#733499719267123200>) to ensure that this isn't already BugMailed?",
      ephemeral: true,
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Yes! Claim!",
              customId: `${this.No}-CLAIM`,
              style: "SUCCESS"
            },
            {
              type: "BUTTON",
              label: "Oops! It's BugMailed!",
              customId: `${this.No}-BUGMAILED`,
              style: "DANGER"
            }
          ]
        }
      ]
    });

    setTimeout(() => {
      if (this.state !== "OPEN" || this.pendingDeletion) return;
      DTT.freeBugMailLog(`${interaction.user} did not fully claim Free BugMail request #${this.No}.`);

      interactionMessage.edit({
        components: [
          {
            type: "ACTION_ROW",
            components: [
              interactionComponent.setDisabled(false)
            ]
          }
        ]
      });

      interaction.editReply({
        content: "Interaction took too long - the claim button is now free again!",
        components: []
      });
    }, 60000);
  }

  async claim(interaction: ButtonInteraction): Promise<void> {
    await DTT.Maria.query("UPDATE `Free BugMails` SET `Claimed By ID` = ?, `State` = ? WHERE `No` = ?;", [
      interaction.user.id,
      "PENDING",
      this.No
    ]);

    const message = await this.fetchMessage();

    message.embeds[0].fields[0] = {
      name: "Notes",
      value: `Claimed by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), "R")}`,
      inline: false
    };

    await message.edit({
      embeds: [
        message.embeds[0]
      ],
      components: []
    });

    await message.react(DTT.emoji("typing"));
    const guildMember = interaction.member as GuildMember;
    if (guildMember.roles.cache.has(this.freeBugMail.id)) await guildMember.roles.remove(this.freeBugMail);
    DTT.freeBugMailLog(`${interaction.user} successfully claimed Free BugMail request #${this.No}.`);

    await this.bugmailDiscussion.send({
      content: `${interaction.user} has just claimed the Free BugMail request of <@${this.userId}>.\nBe sure to post in <#733499719267123200> and ${DTT.channel("bugmailed-reports")} for clarity!`,
      embeds: message.embeds
    });

    await interaction.update({
      content: `You have successfully claimed Free BugMail request [#${this.No}](${this.messageLink}) belonging to <@${this.userId}>!`,
      components: []
    });

    this.claimedById = interaction.user.id;
    this.state = "PENDING";
    if (this.hourTimeout !== null) clearTimeout(this.hourTimeout);
    this.hourTimeout = null;
    this.timeout();
  }

  async edit(interaction: CommandInteraction, text: string): Promise<void> {
    const message = await this.fetchMessage();

    await message.edit({
      embeds: [
        message.embeds[0].setDescription(text)
      ]
    });

    DTT.freeBugMailLog(`${interaction.user} edited Free BugMail request #${this.No}.\n\n${text}`);

    return await interaction.reply({
      content: `Successfully edited Free BugMail request #${this.No}!`,
      ephemeral: true
    });
  }

  async resolve(interaction: ButtonInteraction | CommandInteraction, fromTimeout: boolean): Promise<void> {
    await DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ]);

    if (this.reminderTimeout !== null) clearTimeout(this.reminderTimeout);
    this.state = "RESOLVED";
    this.reminderTimeout = null;
    const message = await this.fetchMessage().catch(() => null);

    if (!fromTimeout) {
      await interaction.reply({
        content: `You have completed Free BugMail request #${this.No} belonging to <@${this.userId}>!`,
        ephemeral: true
      });
    }

    const guildMember = interaction.member as GuildMember;
    if (!guildMember.roles.cache.has(this.freeBugMail.id)) guildMember.roles.add(this.freeBugMail);

    await this.bugmailDiscussion.send({
      content: `${interaction.user} has completed the Free BugMail request of <@${this.userId}>!\nThe ${this.freeBugMail} role has now been added to you!`,
      embeds: message?.embeds,
      allowedMentions: {
        parse: [
          "users"
        ]
      }
    });

    await message?.delete();
    DTT.freeBugMailLog(`${interaction.user} has completed Free BugMail request #${this.No}!`);
  }

  async remove(): Promise<void> {
    if (this.hourTimeout !== null) clearTimeout(this.hourTimeout);
    if (this.reminderTimeout !== null) clearTimeout(this.reminderTimeout);
    this.hourTimeout = null;
    this.reminderTimeout = null;
    DTT.freeBugMailLog(`Free BugMail request #${this.No} has been manually deleted and ergo automatically resolved.`);

    await DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
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

  async alreadyBugMailed(interaction: ButtonInteraction): Promise<void> {
    const message = await this.fetchMessage();

    message.embeds[0].fields[0] = {
      name: "Notes",
      value: `Disabled by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), Formatters.TimestampStyles.RelativeTime)}`,
      inline: false
    };

    await message.edit({
      embeds: [
        message.embeds[0]
      ],
      components: [
        {
          type: "ACTION_ROW",
          components: [
            message.components[0].components[0].setDisabled()
          ]
        }
      ]
    });

    await DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "DISABLED",
      this.No
    ]);

    this.state = "DISABLED";
    this.pendingDeletion = true;
    DTT.freeBugMailLog(`${interaction.user} has specified Free BugMail request #${this.No} as already claimed.`);

    const { id } = await this.bugmailDiscussion.send({
      content: `Free BugMail request #${this.No} has been specified as already BugMailed. It is now pending deletion.`,
      embeds: message.embeds,
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Restore",
              customId: `${this.No}-RESTORE`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    this.disabledMessageId = id;

    await interaction.update({
      content: `You have marked Free BugMail request [#${this.No}](${this.messageLink}) as already BugMailed.`,
      components: []
    });
  }

  async restore(interaction: ButtonInteraction): Promise<void> {
    const guildMember = interaction.member as GuildMember;
    const interactionMessage = interaction.message as Message;

    if (!guildMember.roles.cache.hasAny(...DTT.modRoles.map(modRole => modRole.id))) {
      DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but failed authorisation checks.`);

      interaction.reply({
        content: "You do not have permission to perform this interaction.",
        ephemeral: true
      });

      return;
    }

    try {
      const message = await this.fetchMessage();

      DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
        "OPEN",
        this.No
      ]);

      message.embeds[0].fields = [];

      await message.edit({
        embeds: [
          message.embeds[0]
        ],
        components: [
          {
            type: "ACTION_ROW",
            components: [
              message.components[0].components[0].setDisabled(false)
            ]
          }
        ]
      });

      await interactionMessage.edit({
        components: [
          {
            type: "ACTION_ROW",
            components: [
              (interaction.component as MessageButton).setDisabled()
            ]
          }
        ]
      });

      DTT.freeBugMailLog(`${interaction.user} restored Free BugMail request #${this.No}!`);
      return await interaction.reply(`Free BugMail request [#${this.No}](${this.messageLink}) has been restored.`);
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        if (error.code === Constants.APIErrors.UNKNOWN_MESSAGE) {
          await interactionMessage.edit({
            components: []
          });

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

  get bugmailQueue(): TextChannel {
    return DTT.channel("bugmail-queue") as TextChannel;
  }

  get bugmailDiscussion(): TextChannel {
    return DTT.channel("bugmail-discussion") as TextChannel;
  }

  get freeBugMail(): Role {
    return DTT.role("Free BugMail");
  }

  get messageLink(): string {
    return `https://discord.com/channels/${DTT.guild.id}/${this.bugmailQueue.id}/${this.messageId}`;
  }

  static addRole(interaction: ButtonInteraction): void {
    const logText = `${interaction.user} interacted with the "Opt in" button.`;
    const guildMember = interaction.member as GuildMember;
    const freeBugMail = DTT.role("Free BugMail");

    if (guildMember.roles.cache.has(freeBugMail.id)) {
      DTT.freeBugMailLog(`${logText} ${freeBugMail} already exists on account.`);

      interaction.reply({
        content: `You already have the ${freeBugMail} role.`,
        ephemeral: true
      });

      return;
    }

    guildMember.roles.add(freeBugMail).then(() => {
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

  static removeRole(interaction: ButtonInteraction): void {
    const logText = `${interaction.user} interacted with the "Opt out" button.`;
    const guildMember = interaction.member as GuildMember;
    const freeBugMail = DTT.role("Free BugMail");

    if (!guildMember.roles.cache.has(freeBugMail.id)) {
      DTT.freeBugMailLog(`${logText} ${freeBugMail} does not already exist on account.`);

      interaction.reply({
        content: `You do not already have the ${freeBugMail} role.`,
        ephemeral: true
      });

      return;
    }

    guildMember.roles.remove(freeBugMail).then(() => {
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

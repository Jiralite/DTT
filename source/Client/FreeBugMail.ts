import { ButtonInteraction, CommandInteraction, Formatters, FreeBugMailData, FreeBugMailState, GuildMember, Message, MessageButton, Role, Snowflake, TextChannel } from "discord.js";
import { OkPacket } from "mysql";
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

  create(interaction: CommandInteraction, text: string): void {
    DTT.Maria.query("INSERT INTO `Free BugMails` SET ?;", {
      Timestamp: this.timestamp,
      ["Weekly Timestamp"]: this.weeklyTimestamp,
      ["Message ID"]: this.messageId,
      ["User ID"]: this.userId,
      Mentioned: this.mentioned,
      State: this.state
    }, (E, { insertId }: OkPacket) => {
      if (E) {
        DTT.log("Error during FreeBugMail#create().", E);
        interaction.editReply("There was an error during Free BugMail creation.");
        return;
      }

      this.No = insertId;
      this.mentioned = false;
      this.state = "OPEN";
      this.mentionedTimeout();
      DTT.freeBugMails.set(this.No, this);

      interaction.editReply({
        embeds: [
          {
            description: text,
            timestamp: Date.now(),
            color: interaction.guild?.me?.displayColor ?? 0,
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
      }).then(() => DTT.freeBugMailLog(`${interaction.user} created Free BugMail request #${this.No}.\n\n${text}`)).catch(error => {
        DTT.log("Error during FreeBugMail#create().", error);
        interaction.editReply("here was an error during Free BugMail creation.");
      });
    });
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

  resumePendingTimeout(interaction: ButtonInteraction): void {
    DTT.freeBugMailLog(`${interaction.user} has stated Free BugMail request #${this.No} is still ongoing after a week.`);

    DTT.Maria.query("UPDATE `Free BugMails` SET `Weekly Timestamp` = ? WHERE `No` = ?;", [
      Date.now(),
      this.No
    ], E => {
      if (E) {
        DTT.log("Error during FreeBugMail#resumePendingTimeout().", E);

        interaction.reply({
          content: "There was an error during Free BugMail resume.",
          ephemeral: true
        });

        return;
      }

      this.weeklyTimestamp = Date.now();

      interaction.update({
        content: `You've stated that the BugMail is still ongoing, <@${this.claimedById}>. Ongoing it remains!`,
        components: []
      });

      this.timeout();
    });
  }

  resolvePendingTimeout(interaction: ButtonInteraction): void {
    DTT.freeBugMailLog(`${interaction.user} stated has stated Free BugMail request #${this.No} has been completed after a weekly reminder.`);

    interaction.update({
      content: `You've stated that Free BugMail request #${this.No} has been completed, <@${this.claimedById}>. Completed it be!`,
      components: []
    });

    this.resolve(interaction, true);
  }

  preClaim(interaction: ButtonInteraction): void {
    const interactionMessage = interaction.message as Message;
    const interactionComponent = interaction.component as MessageButton;
    const pendingBugMail = DTT.freeBugMails.find(({ claimedById, state }) => claimedById === interaction.user.id && state === "PENDING");

    if (pendingBugMail) {
      DTT.freeBugMailLog(`${interaction.user} attempted to claim Free BugMail request #${this.No} but already has a pending BugMail (#${pendingBugMail.No}).`);

      interaction.reply({
        content: `You seem to already have claimed a pending Free BugMail request for <@${pendingBugMail.userId}>: [#${pendingBugMail.No}](${pendingBugMail.messageLink})`,
        ephemeral: true
      });

      return;
    }

    interactionMessage.edit({
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

    interaction.reply({
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
    }).then(() => setTimeout(() => {
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
    }, 60000));
  }

  claim(interaction: ButtonInteraction): void {
    DTT.Maria.query("UPDATE `Free BugMails` SET ? WHERE `No` = ?;", [
      {
        ["Claimed By ID"]: interaction.user.id,
        State: "PENDING"
      },
      this.No
    ], async E => {
      if (E) {
        DTT.log("Error during FreeBugMail#claim().", E);

        interaction.reply({
          content: "There was an error during claiming this Free BugMail request.",
          ephemeral: true
        });

        return;
      }

      const message = await this.fetchMessage();

      message.embeds[0].fields[0] = {
        name: "Notes",
        value: `Claimed by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), "R")}`,
        inline: false
      };

      message.edit({
        embeds: [
          message.embeds[0]
        ],
        components: []
      });

      const typing = DTT.emoji("typing");
      typing !== null ? message.react(typing) : DTT.freeBugMailLog(`Couldn't find the "typing" emoji to react with for Free BugMail request #${this.No}.`);
      const guildMember = interaction.member as GuildMember;
      if (guildMember.roles.cache.has(this.freeBugMail.id)) guildMember.roles.remove(this.freeBugMail);
      DTT.freeBugMailLog(`${interaction.user} successfully claimed Free BugMail request #${this.No}.`);

      this.bugmailDiscussion.send({
        content: `${interaction.user} has just claimed the Free BugMail request of <@${this.userId}>.\nBe sure to post in <#733499719267123200> and ${DTT.channel("bugmailed-reports")} for clarity!`,
        embeds: message.embeds
      });

      interaction.update({
        content: `You have successfully claimed Free BugMail request [#${this.No}](${this.messageLink}) belonging to <@${this.userId}>!`,
        components: []
      });

      this.claimedById = interaction.user.id;
      this.state = "PENDING";
      if (this.hourTimeout !== null) clearTimeout(this.hourTimeout);
      this.hourTimeout = null;
      this.timeout();
    });
  }

  edit(interaction: CommandInteraction, text: string): void {
    this.fetchMessage().then(message => message.edit({
      embeds: [
        message.embeds[0].setDescription(text)
      ]
    }).then(() => {
      DTT.freeBugMailLog(`${interaction.user} edited Free BugMail request #${this.No}.\n\n${text}`);

      interaction.reply({
        content: `Successfully edited Free BugMail request #${this.No}!`,
        ephemeral: true
      });
    }));
  }

  resolve(interaction: ButtonInteraction | CommandInteraction, fromTimeout: boolean): void {
    DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ], async E => {
      if (E) {
        DTT.log("Error during FreeBugMail#resolve().", E);

        interaction.reply({
          content: "There was an error completing this Free BugMail request.",
          ephemeral: true
        });

        return;
      }

      if (this.reminderTimeout !== null) clearTimeout(this.reminderTimeout);
      this.state = "RESOLVED";
      this.reminderTimeout = null;
      const message = await this.fetchMessage().catch(() => null);

      if (!fromTimeout) {
        interaction.reply({
          content: `You have completed Free BugMail request #${this.No} belonging to <@${this.userId}>!`,
          ephemeral: true
        });
      }

      const guildMember = interaction.member as GuildMember;
      if (!guildMember.roles.cache.has(this.freeBugMail.id)) guildMember.roles.add(this.freeBugMail);

      this.bugmailDiscussion.send({
        content: `${interaction.user} has completed the Free BugMail request of <@${this.userId}>!\nThe ${this.freeBugMail} role has now been added to you!`,
        embeds: message?.embeds,
        allowedMentions: {
          parse: [
            "users"
          ]
        }
      });

      message?.delete();
      DTT.freeBugMailLog(`${interaction.user} has completed Free BugMail request #${this.No}!`);
    });
  }

  remove(): void {
    if (this.hourTimeout !== null) clearTimeout(this.hourTimeout);
    if (this.reminderTimeout !== null) clearTimeout(this.reminderTimeout);
    this.hourTimeout = null;
    this.reminderTimeout = null;
    DTT.freeBugMailLog(`Free BugMail request #${this.No} has been manually deleted and ergo automatically resolved.`);

    DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ], E => {
      if (E) DTT.freeBugMailLog("Error removing Free BugMail request.", E);
      this.state = "RESOLVED";

      if (this.disabledMessageId) {
        this.bugmailDiscussion.messages.fetch(this.disabledMessageId).then(message => message.edit({
          components: []
        })).catch(() => null);
      }
    });
  }

  alreadyBugMailed(interaction: ButtonInteraction): void {
    this.fetchMessage().then(message => {
      message.embeds[0].fields[0] = {
        name: "Notes",
        value: `Disabled by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), "R")}`,
        inline: false
      };

      message.edit({
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

      DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
        "DISABLED",
        this.No
      ], E => {
        if (E) {
          DTT.log("Error during FreeBugMail#alreadyBugMailed().", E);

          interaction.reply({
            content: "There was an error during disabling this Free BugMail request.",
            ephemeral: true
          });

          return;
        }

        this.state = "DISABLED";
        this.pendingDeletion = true;
        DTT.freeBugMailLog(`${interaction.user} has specified Free BugMail request #${this.No} as already claimed.`);

        this.bugmailDiscussion.send({
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
        }).then(({ id }) => {
          this.disabledMessageId = id;
        });

        interaction.update({
          content: `You have marked Free BugMail request [#${this.No}](${this.messageLink}) as already BugMailed.`,
          components: []
        });
      });
    });
  }

  restore(interaction: ButtonInteraction): void {
    const guildMember = interaction.member as GuildMember;
    const interactionMessage = interaction.message as Message;
    const modRoles = DTT.modRoles;

    if (modRoles.some(modRole => modRole === null)) {
      DTT.freeBugMailLog("Could not locate the moderators. One or more roles could not be found.");

      interaction.reply({
        content: "Couldn't locate the moderators. Is this server civil?",
        ephemeral: true
      });

      return;
    }

    if (!guildMember.roles.cache.hasAny(...modRoles.map(modRole => (modRole as Role).id))) {
      DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but failed authorisation checks.`);

      interaction.reply({
        content: "You do not have permission to perform this interaction.",
        ephemeral: true
      });

      return;
    }

    this.fetchMessage().then(message => {
      DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
        "OPEN",
        this.No
      ], E => {
        if (E) {
          DTT.log("Error during FreeBugMail#restore().", E);

          interaction.reply({
            content: "There was an error restoring this Free BugMail request.",
            ephemeral: true
          });

          return;
        }

        message.embeds[0].fields = [];

        message.edit({
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

        interactionMessage.edit({
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
        interaction.reply(`Free BugMail request [#${this.No}](${this.messageLink}) has been restored.`);
      });
    }).catch(error => {
      if (error.code === 10008) {
        interactionMessage.edit({
          components: []
        });

        DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but the Free BugMail request was not found. The button has now been removed.`);

        return interaction.reply({
          content: `Apparently, Free BugMail request #${this.No} no longer exists. The button has now been removed.`,
          ephemeral: true
        });
      }

      DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but encountered an error.`, error);

      interaction.reply({
        content: "There was an error restoring this Free BugMail request.",
        ephemeral: true
      });
    });
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
    return DTT.role("Free BugMail") as Role;
  }

  get messageLink(): string {
    return `https://discord.com/channels/${DTT.guild.id}/${this.bugmailQueue.id}/${this.messageId}`;
  }

  static addRole(interaction: ButtonInteraction): void {
    const logText = `${interaction.user} interacted with the "Opt in" button.`;
    const guildMember = interaction.member as GuildMember;
    const freeBugMail = DTT.role("Free BugMail");

    if (freeBugMail === null) {
      DTT.freeBugMailLog(`${logText} Apparently, the Free BugMail role cannot be found.`);
      interaction.reply("There was an error opting in.");
      return;
    }

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

    if (freeBugMail === null) {
      DTT.freeBugMailLog(`${logText} Apparently, the Free BugMail role cannot be found.`);
      interaction.reply("There was an error opting out.");
      return;
    }

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

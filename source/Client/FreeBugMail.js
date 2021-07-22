const { Formatters } = require("discord.js");

class FreeBugMail {
  #DTT;

  constructor(DTT, freeBugMail) {
    this.#DTT = DTT;
    this.No = freeBugMail.No;
    this.timestamp = +freeBugMail.Timestamp;
    this.weeklyTimestamp = +freeBugMail["Weekly Timestamp"];
    this.messageId = freeBugMail["Message ID"];
    this.userId = freeBugMail["User ID"];
    this.claimedById = freeBugMail["Claimed By ID"] ?? null;
    this.mentioned = !!freeBugMail.Mentioned;
    this.state = freeBugMail.State;
    this.disabledMessageId = null;
    this.hourTimeout = null;
    this.reminderTimeout = null;
    this.pendingDeletion = false;
  }

  create(interaction, text) {
    this.#DTT.Maria.query("INSERT INTO `Free BugMails` SET ?;", {
      Timestamp: this.timestamp,
      ["Weekly Timestamp"]: this.weeklyTimestamp,
      ["Message ID"]: this.messageId,
      ["User ID"]: this.userId,
      Mentioned: this.mentioned,
      State: this.state
    }, (E, { insertId }) => {
      if (E) {
        this.#DTT.log("Error during FreeBugMail#create().", E);
        interaction.editReply("There was an error during Free BugMail creation.");
        return;
      }

      this.No = insertId;
      this.mentionedTimeout();
      this.#DTT.freeBugMails.set(this.No, this);

      interaction.editReply({
        embeds: [
          {
            description: text,
            timestamp: Date.now(),
            color: interaction.guild.me.displayColor,
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
      }).then(() => this.#DTT.freeBugMailLog(`${interaction.user} created Free BugMail request #${this.No}.\n\n${text}`)).catch(error => {
        this.#DTT.log("Error during FreeBugMail#create().", error);
        interaction.editReply("here was an error during Free BugMail creation.");
      });
    });
  }

  mentionedTimeout() {
    if (this.state !== "OPEN" || this.mentioned) return;
    clearTimeout(this.hourTimeout);

    this.hourTimeout = setTimeout(() => this.bugmailDiscussion.send({
      content: `Hey, is anyone with a ${this.freeBugMail} able to help with request #${this.No} belonging to <@${this.userId}>?`,
      allowedMentions: {
        parse: [
          "roles"
        ]
      }
    }).then(() => this.#DTT.Maria.query("UPDATE `Free BugMails` SET `Mentioned` = ? WHERE `No` = ?;", [
      true,
      this.No
    ])), 3600000 - (Date.now() - this.timestamp));
  }

  timeout() {
    if (this.state !== "PENDING") return;
    clearTimeout(this.reminderTimeout);

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

  resumePendingTimeout(interaction) {
    this.#DTT.freeBugMailLog(`${interaction.user} has stated Free BugMail request #${this.No} is still ongoing after a week.`);

    this.#DTT.Maria.query("UPDATE `Free BugMails` SET `Weekly Timestamp` = ? WHERE `No` = ?;", [
      Date.now(),
      this.No
    ], E => {
      if (E) {
        this.#DTT.log("Error during FreeBugMail#resumePendingTimeout().", E);

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

  resolvePendingTimeout(interaction) {
    this.#DTT.freeBugMailLog(`${interaction.user} stated has stated Free BugMail request #${this.No} has been completed after a weekly reminder.`);

    interaction.update({
      content: `You've stated that Free BugMail request #${this.No} has been completed, <@${this.claimedById}>. Completed it be!`,
      components: []
    });

    this.resolve(interaction, true);
  }

  preClaim(interaction) {
    const pendingBugMail = this.#DTT.freeBugMails.find(({ claimedById, state }) => claimedById === interaction.user.id && state === "PENDING");

    if (pendingBugMail) {
      this.#DTT.freeBugMailLog(`${interaction.user} attempted to claim Free BugMail request #${this.No} but already has a pending BugMail (#${pendingBugMail.No}).`);

      return interaction.reply({
        content: `You seem to already have claimed a pending Free BugMail request for <@${pendingBugMail.userId}>: [#${pendingBugMail.No}](${pendingBugMail.messageLink})`,
        ephemeral: true
      });
    }

    interaction.message.edit({
      components: [
        {
          type: "ACTION_ROW",
          components: [
            interaction.message.components[0].components[0].setDisabled(true)
          ]
        }
      ]
    });

    this.#DTT.freeBugMailLog(`${interaction.user} is attempting to claim Free BugMail request #${this.No} and is being asked to double check before fully claiming.`);

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
      this.#DTT.freeBugMailLog(`${interaction.user} did not fully claim Free BugMail request #${this.No}.`);

      interaction.message.edit({
        components: [
          {
            type: "ACTION_ROW",
            components: [
              interaction.message.components[0].components[0].setDisabled(false)
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

  claim(interaction) {
    this.#DTT.Maria.query("UPDATE `Free BugMails` SET ? WHERE `No` = ?;", [
      {
        ["Claimed By ID"]: interaction.user.id,
        State: "PENDING"
      },
      this.No
    ], async E => {
      if (E) {
        this.#DTT.log("Error during FreeBugMail#claim().", E);

        interaction.reply({
          content: "There was an error during claiming this Free BugMail request.",
          ephemeral: true
        });

        return;
      }

      const message = await this.fetchMessage();
      message.embeds[0].fields[0] = {};
      message.embeds[0].fields[0].name = "Notes";
      message.embeds[0].fields[0].value = `Claimed by ${interaction.user} ${Formatters.time(~~(Date.now() / 1000), "R")}`;

      message.edit({
        embeds: [
          message.embeds[0]
        ],
        components: []
      });

      message.react("<a:typing:852637406334156800>");
      if (interaction.member.roles.cache.has(this.#DTT.role("Free BugMail").id)) interaction.member.roles.remove(this.#DTT.role("Free BugMail"));
      this.#DTT.freeBugMailLog(`${interaction.user} successfully claimed Free BugMail request #${this.No}.`);

      this.#DTT.kanal("bugmail-discussion").send({
        content: `${interaction.user} has just claimed the free BugMail request of <@${this.userId}>.\nBe sure to post in <#733499719267123200> and ${this.#DTT.kanal("bugmailed-reports")} for clarity!`,
        embeds: message.embeds
      });

      interaction.update({
        content: `You have successfully claimed free BugMail request [#${this.No}](${this.messageLink}) belonging to <@${this.userId}>!`,
        components: []
      });

      this.claimedById = interaction.user.id;
      this.state = "PENDING";
      clearTimeout(this.hourTimeout);
      this.hourTimeout = null;
      this.timeout();
    });
  }

  edit(interaction, text) {
    this.fetchMessage().then(message => message.edit({
      embeds: [
        message.embeds[0].setDescription(text)
      ]
    }).then(() => {
      this.#DTT.freeBugMailLog(`${interaction.user} edited Free BugMail request #${this.No}.\n\n${text}`);

      interaction.reply({
        content: `Successfully edited Free BugMail request #${this.No}!`,
        ephemeral: true
      });
    }));
  }

  resolve(interaction, fromTimeout) {
    this.#DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ], async E => {
      if (E) {
        this.#DTT.log("Error during FreeBugMail#resolve().", E);

        interaction.reply({
          content: "There was an error completing this Free BugMail request.",
          ephemeral: true
        });

        return;
      }

      clearTimeout(this.reminderTimeout);
      this.state = "RESOLVED";
      this.reminderTimeout = null;
      const message = await this.fetchMessage().catch(() => null);

      if (!fromTimeout) {
        interaction.reply({
          content: `You have completed Free BugMail request #${this.No} belonging to <@${this.userId}>!`,
          ephemeral: true
        });
      }

      if (!interaction.member.roles.cache.has(this.freeBugMail.id)) interaction.member.roles.add(this.freeBugMail);

      this.bugmailDiscussion.send({
        content: `${interaction.user} has completed the free BugMail request of <@${this.userId}>!\nThe ${this.freeBugMail} role has now been added to you!`,
        embeds: message?.embeds,
        allowedMentions: {
          parse: [
            "users"
          ]
        }
      });

      message?.delete();
      this.#DTT.freeBugMailLog(`${interaction.user} has completed Free BugMail request #${this.No}!`);
    });
  }

  remove() {
    clearTimeout(this.hourTimeout);
    clearTimeout(this.reminderTimeout);
    this.hourTimeout = null;
    this.reminderTimeout = null;
    this.#DTT.freeBugMailLog(`Request #${this.No} has been manually deleted and ergo automatically resolved.`);

    this.#DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ], E => {
      if (E) this.#DTT.freeBugMailLog("Error removing free BugMail request.", E);
      this.state = "RESOLVED";

      this.bugmailDiscussion.messages.fetch(this.disabledMessageId).then(message => message.edit({
        components: []
      })).catch(() => null);
    });
  }

  alreadyBugMailed(interaction) {
    this.fetchMessage().then(message => {
      message.edit({
        components: [
          {
            type: "ACTION_ROW",
            components: [
              message.components[0].components[0].setDisabled(true)
            ]
          }
        ]
      });

      this.#DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
        "DISABLED",
        this.No
      ], E => {
        if (E) {
          this.#DTT.log("Error during FreeBugMail#alreadyBugMailed().", E);

          interaction.reply({
            content: "There was an error during disabling this Free BugMail request.",
            ephemeral: true
          });

          return;
        }

        this.state = "DISABLED";
        this.pendingDeletion = true;
        this.#DTT.freeBugMailLog(`${interaction.user} has specified Free BugMail request #${this.No} as already claimed.`);

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
        });

        interaction.update({
          content: `You have marked Free BugMail request [#${this.No}](${this.messageLink}) as already BugMailed.`,
          ephemeral: true,
          components: []
        });
      });
    });
  }

  restore(interaction) {
    if (!interaction.member.roles.cache.some(({ id }) => [
      interaction.client.role("Admin").id,
      interaction.client.role("Moderator").id,
      interaction.client.role("DT Staff").id,
      interaction.client.role("DT Mod or BA").id
    ].includes(id))) {
      this.#DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but failed authorisation checks.`);

      return interaction.reply({
        content: "You do not have permission to perform this interaction.",
        ephemeral: true
      });
    }

    this.fetchMessage().then(message => {
      this.#DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
        "OPEN",
        this.No
      ], E => {
        if (E) {
          this.#DTT.log("Error during FreeBugMail#restore().", E);

          interaction.reply({
            content: "There was an error restoring this Free BugMail request.",
            ephemeral: true
          });

          return;
        }

        message.edit({
          components: [
            {
              type: "ACTION_ROW",
              components: [
                message.components[0].components[0].setDisabled(false)
              ]
            }
          ]
        });

        interaction.message.edit({
          components: [
            {
              type: "ACTION_ROW",
              components: [
                interaction.message.components[0].components[0].setDisabled(true)
              ]
            }
          ]
        });

        this.#DTT.freeBugMailLog(`${interaction.user} restored Free BugMail request #${this.No}!`);
        interaction.reply(`Free BugMail request [#${this.No}](${this.messageLink}) has been restored.`);
      });
    }).catch(error => {
      if (error.code === 10008) {
        interaction.message.edit({
          components: []
        });

        this.#DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but the Free BugMail request was not found. The button has now been removed.`);

        return interaction.reply({
          content: `Apparently, Free BugMail request #${this.No} no longer exists. The button has now been removed.`,
          ephemeral: true
        });
      }

      this.#DTT.freeBugMailLog(`${interaction.user} attempted to restore Free BugMail request #${this.No} but encountered an error.`, error);

      interaction.reply({
        content: "There was an error restoring this Free BugMail request.",
        ephemeral: true
      });
    });
  }

  fetchMessage() {
    return this.bugmailQueue.messages.fetch(this.messageId);
  }

  get bugmailQueue() {
    return this.#DTT.kanal("bugmail-queue");
  }

  get bugmailDiscussion() {
    return this.#DTT.kanal("bugmail-discussion");
  }

  get freeBugMail() {
    return this.#DTT.role("Free BugMail");
  }

  get messageLink() {
    return `https://discord.com/channels/${this.#DTT.guild.id}/${this.bugmailQueue.id}/${this.messageId}`;
  }

  static addRole(interaction) {
    const logText = `${interaction.user} interacted with the "Opt in" button.`;

    if (interaction.member.roles.cache.has(interaction.client.role("Free BugMail").id)) {
      interaction.client.freeBugMailLog(`${logText} ${interaction.client.role("Free BugMail")} already exists on account.`);

      return interaction.reply({
        content: `You already have the ${interaction.client.role("Free BugMail")} role.`,
        ephemeral: true
      });
    }

    interaction.member.roles.add(interaction.client.role("Free BugMail")).then(() => {
      interaction.client.freeBugMailLog(`${logText} ${interaction.client.role("Free BugMail")} added to account.`);

      interaction.reply({
        content: `The ${interaction.client.role("Free BugMail")} role has been added to you!`,
        ephemeral: true
      });
    }).catch(error => {
      interaction.client.freeBugMailLog(`${logText} Error in ${interaction.client.role("Free BugMail")} addition.`, error);

      interaction.reply({
        content: "There was an error during self-role addition.",
        ephemeral: true
      });
    });
  }

  static removeRole(interaction) {
    const logText = `${interaction.user} interacted with the "Opt out" button.`;

    if (!interaction.member.roles.cache.has(interaction.client.role("Free BugMail").id)) {
      interaction.client.freeBugMailLog(`${logText} ${interaction.client.role("Free BugMail")} does not already exist on account.`);

      return interaction.reply({
        content: `You do not already have the ${interaction.client.role("Free BugMail")} role.`,
        ephemeral: true
      });
    }

    interaction.member.roles.remove(interaction.client.role("Free BugMail")).then(() => {
      interaction.client.freeBugMailLog(`${logText} ${interaction.client.role("Free BugMail")} removed from account.`);

      interaction.reply({
        content: `The ${interaction.client.role("Free BugMail")} role has been removed from you!`,
        ephemeral: true
      });
    }).catch(error => {
      interaction.client.freeBugMailLog(`${logText} Error in ${interaction.client.role("Free BugMail")} removal.`, error);

      interaction.reply({
        content: "There was an error during self-role removal.",
        ephemeral: true
      });
    });
  }
}

module.exports = FreeBugMail;

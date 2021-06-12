class FreeBugMail {
  #DTT;

  constructor(DTT, freeBugMail) {
    this.#DTT = DTT;
    this.No = freeBugMail.No;
    this.timestamp = +freeBugMail.Timestamp;
    this.messageId = freeBugMail["Message ID"];
    this.userId = freeBugMail["User ID"];
    this.claimedById = freeBugMail["Claimed By ID"] ?? null;
    this.mentioned = !!freeBugMail.Mentioned;
    this.state = freeBugMail.State;
    this.hourTimeout = null;
    this.reminderTimeout = null;
  }

  create(interaction, text) {
    this.#DTT.Maria.query("INSERT INTO `Free BugMails` SET ?;", {
      Timestamp: this.timestamp,
      ["Message ID"]: this.messageId,
      ["User ID"]: this.userId,
      Mentioned: this.mentioned,
      State: this.state
    }, (E, { insertId }) => {
      if (E) return reject(E);
      this.No = insertId;
      this.mentionedTimeout();
      this.#DTT.freeBugMails.set(this.No, this);

      interaction.editReply({
        content: text,
        allowedMentions: {
          parse: []
        },
        components: [
          [
            {
              type: "BUTTON",
              label: "Claim",
              customID: `${this.No}-PRECLAIM`,
              style: "PRIMARY"
            }
          ]
        ]
      }).catch(async error => {
        this.#DTT.log("Error during submit interaction.", error);

        interaction.editReply({
          content: "An internal error occured.",
          ephemeral: true
        }).then(() => setTimeout(() => interaction.deleteReply(), 5000));
      });
    });
  }

  mentionedTimeout() {
    if (this.state !== "OPEN" || this.mentioned) return;
    clearTimeout(this.hourTimeout);

    this.hourTimeout = setTimeout(() => this.bugmailDiscussion.send({
      content: `Hey, is anyone with a ${this.freeBugMail} able to help with the request belonging to <@${this.userId}>?`,
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
      content: `Hey, <@${this.claimedById}>. It's been a week. Is the BugMail still ongoing?`,
      components: [
        [
          {
            type: "BUTTON",
            label: "Yes",
            customID: `${this.No}-PENDING`,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "No",
            customID: `${this.No}-RESOLVED`,
            style: "SECONDARY"
          }
        ]
      ]
    }), 604800000 - (Date.now() - this.timestamp));
  }

  resumePendingTimeout(interaction) {
    interaction.update({
      content: `You've stated that the BugMail is still ongoing, <@${this.claimedById}>. Ongoing it remains!`,
      components: []
    });

    this.timeout();
  }

  resolvePendingTimeout(interaction) {
    interaction.update({
      content: `You've stated that the BugMail has been completed, <@${this.claimedById}>. Completed it be!`,
      components: []
    });

    this.resolve(interaction, true);
  }

  preClaim(interaction) {
    const pendingBugMail = this.#DTT.freeBugMails.find(({ claimedById, state }) => claimedById === interaction.user.id && state === "PENDING");

    if (pendingBugMail) {
      return interaction.reply({
        content: `You seem to already have a pending free BugMail for <@${pendingBugMail.userId}>.`,
        ephemeral: true
      });
    }

    interaction.message.edit({
      components: [
        [
          interaction.message.components[0].components[0].setDisabled(true)
        ]
      ]
    });

    interaction.reply({
      content: "⚠️ Have you searched in Discord Testers (specifically <#733499719267123200>) to ensure that this isn't already BugMailed?",
      ephemeral: true,
      components: [
        [
          {
            type: "BUTTON",
            label: "Yes! Claim!",
            customID: `${this.No}-CLAIM`,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Oops! It's BugMailed!",
            customID: `${this.No}-BUGMAILED`,
            style: "DANGER"
          }
        ]
      ]
    }).then(() => setTimeout(() => {
      interaction.message.edit({
        components: [
          [
            interaction.message.components[0].components[0].setDisabled(false)
          ]
        ]
      });

      interaction.editReply({
        content: "Interaction took too long - the claim button is now free again!",
        ephemeral: true,
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
      if (E) return reject(E);
      const message = await this.fetchMessage();

      message.edit({
        components: []
      });

      message.react("<a:typing:852637406334156800>");
      if (interaction.member.roles.cache.has(this.#DTT.role("Free BugMail").id)) interaction.member.roles.remove(this.#DTT.role("Free BugMail"));
      this.#DTT.kanal("bugmail-discussion").send(`${interaction.user} has just claimed the free BugMail request of <@${FreeBugMail.userId}>.\n${message.url}`);

      interaction.reply({
        content: `You have successfully claimed the free BugMail request of <@${this.userId}>!`,
        ephemeral: true
      });

      this.claimedById = interaction.user.id;
      this.state = "PENDING";
      clearTimeout(this.hourTimeout);
      this.hourTimeout = null;
      this.timeout();
    });
  }

  resolve(interaction, fromTimeout = false) {
    this.#DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ], async E => {
      if (E) return this.#DTT.log("Error completing free BugMail request.", E);
      clearTimeout(this.reminderTimeout);
      this.state = "RESOLVED";
      this.reminderTimeout = null;

      const message = await this.fetchMessage().catch(() => null);
      message?.delete();

      if (!fromTimeout) interaction.reply({
        content: `You've completed the free BugMail request of <@${this.userId}>!`,
        ephemeral: true
      });

      if (!interaction.member.roles.cache.has(this.freeBugMail.id)) interaction.member.roles.add(this.freeBugMail);

      this.bugmailDiscussion.send({
        content: `${interaction.user} has completed the free BugMail request of <@${this.userId}>!\nThe ${this.freeBugMail} role has now been added to you!`,
        allowedMentions: {
          parse: [
            "users"
          ]
        }
      });
    });
  }

  remove() {
    clearTimeout(this.hourTimeout);
    clearTimeout(this.reminderTimeout);
    this.hourTimeout = null;
    this.reminderTimeout = null;

    this.#DTT.Maria.query("UPDATE `Free BugMails` SET `State` = ? WHERE `No` = ?;", [
      "RESOLVED",
      this.No
    ], E => {
      if (E) this.#DTT.log("Error removing free BugMail request.", E);
    });
  }

  alreadyBugMailed(interaction) {
    this.fetchMessage().then(message => {
      interaction.message.edit({
        components: [
          [
            interaction.message.components[0].components[0].setDisabled()
          ]
        ]
      });

      this.bugmailDiscussion.send(`Apparently, this has already been BugMailed. Someone delete it!\n${message.url}`);

      interaction.reply({
        content: "You have marked this free BugMail request as already BugMailed.",
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
}

module.exports = FreeBugMail;

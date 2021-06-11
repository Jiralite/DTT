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

  create() {
    return new Promise((resolve, reject) => this.#DTT.Maria.query("INSERT INTO `Free BugMails` SET ?;", {
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
      resolve();
    }));
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

  claim(claimedById) {
    return new Promise((resolve, reject) => this.#DTT.Maria.query("UPDATE `Free BugMails` SET ? WHERE `No` = ?;", [
      {
        ["Claimed By ID"]: claimedById,
        State: "PENDING"
      },
      this.No
    ], E => {
      if (E) return reject(E);
      this.claimedById = claimedById;
      this.state = "PENDING";
      clearTimeout(this.hourTimeout);
      this.hourTimeout = null;
      this.timeout();
      resolve();
    }));
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

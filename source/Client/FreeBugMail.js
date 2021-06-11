class FreeBugMail {
  #DTT;

  constructor(DTT, freeBugMail) {
    this.#DTT = DTT;
    this.No = freeBugMail.No;
    this.timestamp = +freeBugMail.Timestamp;
    this.messageId = freeBugMail["Message ID"];
    this.userId = freeBugMail["User ID"];
    this.claimedById = freeBugMail["Claimed By ID"] ?? null;
    this.state = freeBugMail.State;
    this.reminderTimeout = null;
  }

  create() {
    return new Promise((resolve, reject) => this.#DTT.Maria.query("INSERT INTO `Free BugMails` SET ?;", {
      Timestamp: this.timestamp,
      ["Message ID"]: this.messageId,
      ["User ID"]: this.userId,
      State: this.state
    }, (E, { insertId }) => {
      if (E) return reject(E);
      this.No = insertId;
      this.#DTT.freeBugMails.set(this.No, this);
      resolve();
    }));
  }

  timeout() {
    if (this.state !== "PENDING") return;
    clearTimeout(this.reminderTimeout);

    this.reminderTimeout = setTimeout(() => this.#DTT.guild.channels.resolve("852592316438020136").send({
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

    this.resolve();
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
      this.timeout();
      resolve();
    }));
  }

  resolve(interaction = null) {
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

      interaction?.reply({
        content: `You've completed the free BugMail request of <@${this.userId}>!`,
        ephemeral: true
      });

      this.#DTT.channels.resolve("852581876030898176").send(`${interaction.user} has completed the free BugMail request of <@${this.userId}>!\nFeel free to opt in again for the <@&852589448070692947> role!`, {
        allowedMentions: {
          parse: []
        }
      });
    });
  }

  fetchMessage() {
    return this.#DTT.channels.resolve("852581876030898176").messages.fetch(this.messageId);
  }
}

module.exports = FreeBugMail;

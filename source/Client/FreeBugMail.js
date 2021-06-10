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
      resolve();
    }));
  }

  fetchMessage() {
    return this.#DTT.channels.resolve("852581876030898176").messages.fetch(this.messageId);
  }
}

module.exports = FreeBugMail;

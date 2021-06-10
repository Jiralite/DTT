class FreeBugMail {
  #DTT;

  constructor(DTT, freeBugMail) {
    this.#DTT = DTT;
    this.No = freeBugMail.No;
    this.timestamp = +freeBugMail.Timestamp;
    this.messageId = freeBugMail["Message ID"];
    this.userId = freeBugMail["User ID"];
  }

  create() {
    return new Promise((resolve, reject) => this.#DTT.Maria.query("INSERT INTO `Free BugMails` SET ?;", {
      Timestamp: this.timestamp,
      ["Message ID"]: this.messageId,
      ["User ID"]: this.userId
    }, (E, { insertId }) => {
      if (E) return reject(E);
      this.No = insertId;
      this.#DTT.freeBugMails.set(this.No, this);
    }));
  }

  fetchMessage() {
    return this.#DTT.channels.resolve("852581876030898176").messages.fetch(this.messageId);
  }
}

module.exports = FreeBugMail;

class complete {
  #DTT;

  constructor(DTT) {
    this.name = "complete";
    this.#DTT = DTT;
  }

  async traditional(interaction) {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${this.name}\` Slash Command.`;

    if (interaction.channelId !== this.#DTT.kanal("bugmail-queue").id) {
      this.#DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return interaction.reply({
        content: `Please use this command in ${this.#DTT.kanal("bugmail-queue")}.`,
        ephemeral: true
      });
    }

    const number = interaction.options.getInteger("number");
    const FreeBugMail = this.#DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      this.#DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return interaction.reply({
        content: "Cannot find the Free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state === "DISABLED") {
      this.#DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which has been disabled.`);

      return interaction.reply({
        content: "This Free BugMail request is disabled.",
        ephemeral: true
      });
    }

    if ((FreeBugMail.userId !== interaction.user.id && FreeBugMail.claimedById !== interaction.user.id) || FreeBugMail.state !== "PENDING") {
      this.#DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which the account is not the author of or the claimer of.`);

      return interaction.reply({
        content: "This Free BugMail request cannot be completed.",
        ephemeral: true
      });
    }

    FreeBugMail.resolve(interaction, false);
  }

  static get commandData() {
    return {
      type: "SUB_COMMAND",
      name: "complete",
      description: "Completes a Free BugMail request.",
      options: [
        {
          type: "INTEGER",
          name: "number",
          description: "The Free BugMail request # to complete.",
          required: true
        }
      ]
    };
  }
}

module.exports = complete;

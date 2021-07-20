class complete {
  #DTT;

  constructor(DTT) {
    this.name = "complete";
    this.#DTT = DTT;
  }

  async traditional(interaction, logText) {
    logText += `\`${this.name}\` Slash Command. `;

    if (interaction.channelId !== this.#DTT.kanal("bugmail-queue").id) {
      logText += `Wrong channel: ${this.#DTT.guild.channels.resolve(interaction.channelId)}`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: `Please use this command in ${this.#DTT.kanal("bugmail-queue")}.`,
        ephemeral: true
      });
    }

    const number = interaction.options.getInteger("number");
    const FreeBugMail = this.#DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      logText += `Could not find free BugMail request with id ${number}.`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state === "DISABLED") {
      logText += `Attempted to complete #${FreeBugMail.No} which has been disabled.`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "This free BugMail request is disabled.",
        ephemeral: true
      });
    }

    if ((FreeBugMail.userId !== interaction.user.id && FreeBugMail.claimedById !== interaction.user.id) || FreeBugMail.state !== "PENDING") {
      logText += `Attempted to complete #${FreeBugMail.No} which the account is not the author of or the claimer of.`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "This free BugMail request cannot be completed.",
        ephemeral: true
      });
    }

    FreeBugMail.resolve(interaction, false, logText);
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

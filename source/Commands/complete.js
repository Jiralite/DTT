class complete {
  #DTT;

  constructor(DTT) {
    this.name = "complete";
    this.#DTT = DTT;
  }

  async traditional(interaction) {
    if (interaction.channelID !== this.#DTT.kanal("bugmail-queue").id) {
      return interaction.reply({
        content: `Please use this command in ${this.#DTT.kanal("bugmail-queue")}.`,
        ephemeral: true
      });
    }

    const text = interaction.options.first().value;
    const FreeBugMail = this.#DTT.freeBugMails.find(({ messageId }) => messageId === text);

    if (!FreeBugMail) {
      return interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if ((FreeBugMail.userId !== interaction.user.id && FreeBugMail.claimedById !== interaction.user.id) || FreeBugMail.state !== "PENDING") {
      return interaction.reply({
        content: "This free BugMail request cannot be completed.",
        ephemeral: true
      });
    }

    FreeBugMail.resolve(interaction);
  }
}

module.exports = complete;

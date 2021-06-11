class complete {
  #DTT;

  constructor(DTT) {
    this.name = "complete";
    this.#DTT = DTT;
  }

  async traditional(interaction) {
    if (interaction.channelID !== "852581876030898176") {
      return interaction.reply({
        content: "Please use this command in <#852581876030898176>.",
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

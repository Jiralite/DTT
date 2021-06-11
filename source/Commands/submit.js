class submit {
  #DTT;

  constructor(DTT) {
    this.name = "submit";
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

    if (text.length >= 1500) {
      return interaction.reply({
        content: "That's way too long. Shorten it down and keep it concise!",
        ephemeral: true
      });
    }

    await interaction.defer();
    const message = await interaction.fetchReply();

    const FreeBugMail = new this.#DTT.FreeBugMail(this.#DTT, {
      Timestamp: interaction.createdTimestamp,
      ["Message ID"]: message.id,
      ["User ID"]: interaction.user.id,
      Mentioned: false,
      State: "OPEN"
    });

    FreeBugMail.create(interaction, text);
  }
}

module.exports = submit;

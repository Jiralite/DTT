class submit {
  #DTT;

  constructor(DTT) {
    this.name = "submit";
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
      ["User ID"]: interaction.user.id
    });

    FreeBugMail.create().then(() => interaction.editReply({
      content: text,
      allowedMentions: {
        parse: []
      }
    })).catch(async error => {
      this.#DTT.log("Error during submit interaction.", error);

      interaction.editReply({
        content: "An internal error occured.",
        ephemeral: true
      }).then(() => setTimeout(() => interaction.deleteReply(), 5000));
    });
  }
}

module.exports = submit;

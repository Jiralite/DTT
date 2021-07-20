class submit {
  #DTT;

  constructor(DTT) {
    this.name = "submit";
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

    const text = interaction.options.getString("text");

    if (text.length >= 1500) {
      logText += `Max character count reached (1500):\n\n${text}`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "That's way too long. Shorten it down and keep it concise!",
        ephemeral: true
      });
    }

    await interaction.defer();
    const message = await interaction.fetchReply();

    const FreeBugMail = new this.#DTT.FreeBugMail(this.#DTT, {
      Timestamp: interaction.createdTimestamp,
      ["Weekly Timestamp"]: interaction.createdTimestamp,
      ["Message ID"]: message.id,
      ["User ID"]: interaction.user.id,
      Mentioned: false,
      State: "OPEN"
    });

    FreeBugMail.create(interaction, text, logText);
  }

  static get commandData() {
    return {
      type: "SUB_COMMAND",
      name: "submit",
      description: "Submits a Free BugMail request.",
      options: [
        {
          type: "STRING",
          name: "text",
          description: "The text to submit.",
          required: true
        }
      ]
    };
  }
}

module.exports = submit;

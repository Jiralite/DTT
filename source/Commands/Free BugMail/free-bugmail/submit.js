class submit {
  #DTT;

  constructor(DTT) {
    this.name = "submit";
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

    const text = interaction.options.getString("text");

    if (text.length >= 1500) {
      this.#DTT.freeBugMailLog(`${logText} Text too long (>= 1500 characters):\n\n${text}`);

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

    FreeBugMail.create(interaction, text);
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

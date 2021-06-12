class submit {
  #DTT;

  constructor(DTT) {
    this.name = "submit";
    this.#DTT = DTT;
  }

  async traditional(interaction, logText) {
    logText += `\`${this.name}\` Slash Command. `;

    if (interaction.channelID !== this.#DTT.kanal("bugmail-queue").id) {
      logText += `Wrong channel: ${this.#DTT.guild.channels.resolve(interaction.channelID)}`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: `Please use this command in ${this.#DTT.kanal("bugmail-queue")}.`,
        ephemeral: true
      });
    }

    const text = interaction.options.first().value;

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
      ["Message ID"]: message.id,
      ["User ID"]: interaction.user.id,
      Mentioned: false,
      State: "OPEN"
    });

    FreeBugMail.create(interaction, text, logText);
  }

  get commandData() {
    return [
      {
        name: "submit",
        description: "Used for submitting free BugMail requests.",
        options: [
          {
            type: "STRING",
            name: "text",
            description: "Submits a Free BugMail request.",
            required: true
          }
        ]
      },
      [
        {
          id: this.#DTT.guild.roles.everyone.id,
          type: "ROLE",
          permission: false
        },
        {
          id: this.#DTT.role("Tester").id,
          type: "ROLE",
          permission: true
        }
      ]
    ];
  }
}

module.exports = submit;

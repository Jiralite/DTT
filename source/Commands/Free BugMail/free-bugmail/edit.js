class edit {
  #DTT;

  constructor(DTT) {
    this.name = "edit";
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
    const text = interaction.options.getString("text");
    const FreeBugMail = this.#DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      logText += `Could not find free BugMail request with id ${number}.`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.userId !== interaction.user.id) {
      logText += `Attempted to edit #${FreeBugMail.No} which the account is not the author of.`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "This Free BugMail request cannot be edited by you.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state !== "OPEN") {
      logText += `Attempted to edit request ${number} which was not open.`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "This Free BugMail request is not open.",
        ephemeral: true
      });
    }

    if (text.length >= 1500) {
      logText += `Max character count reached (1500):\n\n${text}`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: "That's way too long. Shorten it down and keep it concise!",
        ephemeral: true
      });
    }

    FreeBugMail.edit(interaction, text, logText);
  }

  static get commandData() {
    return {
      type: "SUB_COMMAND",
      name: "edit",
      description: "Edits a Free BugMail request.",
      options: [
        {
          type: "INTEGER",
          name: "number",
          description: "The Free BugMail request # to edit.",
          required: true
        },
        {
          type: "STRING",
          name: "text",
          description: "The new content of the Free BugMail request.",
          required: true
        }
      ]
    };
  }
}

module.exports = edit;

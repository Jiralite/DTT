class complete {
  #DTT;

  constructor(DTT) {
    this.name = "complete";
    this.#DTT = DTT;
  }

  async traditional(interaction, logText) {
    logText += `\`${this.name}\` Slash Command. `;

    if (interaction.channelID !== this.#DTT.kanal("bugmail-queue").id) {
      logText += `Wrong channel: ${DTT.guild.channels.resolve(interaction.channelID)}`;
      this.#DTT.freeBugMailLog(logText);

      return interaction.reply({
        content: `Please use this command in ${this.#DTT.kanal("bugmail-queue")}.`,
        ephemeral: true
      });
    }

    const text = interaction.options.first().value;
    const FreeBugMail = this.#DTT.freeBugMails.find(({ messageId }) => messageId === text);

    if (!FreeBugMail) {
      logText += `Could not find free BugMail request with message id ${text}.`;
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

  get commandData() {
    return [
      {
        name: "complete",
        description: "Used for completing free BugMail requests.",
        options: [
          {
            type: "STRING",
            name: "message_id",
            description: "Completes a Free BugMail request.",
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

module.exports = complete;

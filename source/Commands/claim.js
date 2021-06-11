class claim {
  #DTT;

  constructor(DTT) {
    this.name = "claim";
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
    const pendingBugMail = this.#DTT.freeBugMails.find(({ claimedById, state }) => claimedById === interaction.user.id && state === "PENDING");

    if (!FreeBugMail) {
      return interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state === "PENDING") {
      return interaction.reply({
        content: "This free BugMail is already claimed.",
        ephemeral: true
      });
    }

    if (pendingBugMail) {
      return interaction.reply({
        content: `You seem to already have a pending free BugMail for <@${pendingBugMail.userId}>.`,
        ephemeral: true
      });
    }

    FreeBugMail.fetchMessage().then(async message => {
      FreeBugMail.claim(interaction.user.id).then(async () => {
        await message.react("<a:typing:852637406334156800>");
        if (interaction.member.roles.cache.has(this.#DTT.role("Free BugMail").id)) await interaction.member.roles.remove(this.#DTT.role("Free BugMail"));

        interaction.reply({
          content: `You have successfully claimed the free BugMail request of <@${FreeBugMail.userId}>!`,
          ephemeral: true
        });

        this.#DTT.kanal("bugmail-discussion").send(`${interaction.user} has just claimed the free BugMail request of <@${FreeBugMail.userId}>.\n${message.url}`);
      }).catch(error => {
        this.#DTT.log("Error during claim interaction.", error);

        interaction.reply({
          content: "An internal error occured.",
          ephemeral: true
        });
      });
    }).catch(error => {
      this.#DTT.log("Error resolving a BugMail request message.", error);

      interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    });
  }
}

module.exports = claim;

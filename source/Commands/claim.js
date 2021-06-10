class claim {
  #DTT;

  constructor(DTT) {
    this.name = "claim";
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

    FreeBugMail.fetchMessage().then(async message => {
      await message.react("<a:typing:852637406334156800>");
      if (interaction.member.roles.cache.has("852589448070692947")) await interaction.member.roles.remove("852589448070692947");

      interaction.reply({
        content: `You have successfully claimed the free BugMail request of <@${FreeBugMail.userId}>!`,
        ephemeral: true
      });

      this.#DTT.guild.channels.resolve("852592316438020136").send(`${interaction.user} has just claimed the free BugMail request of <@${FreeBugMail.userId}>.`);
    }).catch(error => {
      this.#DTT.log("Error resolving a BugMail request message.", error);

      interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    })
  }
}

module.exports = claim;

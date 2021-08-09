import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";
import DTT from "../../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "edit";

  constructor(DTT: DTT) {
    this.DTT = DTT;
  }

  async traditional(interaction: CommandInteraction) {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${this.name}\` Slash Command.`;
    const bugmailQueue = this.DTT.kanal("bugmail-queue");
    
    if (bugmailQueue === null) {
      this.DTT.freeBugMailLog(`${logText} Apparently, the bugmail-queue channel cannot be found.`);

      return interaction.reply({
        content: "Error, cannot find the BugMail Queue channel.",
        ephemeral: true
      });
    }

    if (interaction.channelId !== bugmailQueue.id) {
      this.DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });
    }

    const number = interaction.options.getInteger("number");
    const text = interaction.options.getString("text");

    if (number === null || text === null) {
      this.DTT.freeBugMailLog(`${logText} Required parameters \`number\` and \`text\` both not supplied.`);

      return interaction.reply({
        content: "Error: required parameters did not have arguments.",
        ephemeral: true
      });
    }

    const FreeBugMail = this.DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      this.DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.userId !== interaction.user.id) {
      this.DTT.freeBugMailLog(`${logText} Attempted to edit #${FreeBugMail.No} which the account is not the author of.`);

      return interaction.reply({
        content: "This Free BugMail request cannot be edited by you.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state !== "OPEN") {
      this.DTT.freeBugMailLog(`${logText} Attempted to edit Free BugMail request #${FreeBugMail.No} which was not open.`);

      return interaction.reply({
        content: "This Free BugMail request is not open.",
        ephemeral: true
      });
    }

    if (text.length >= 1500) {
      this.DTT.freeBugMailLog(`${logText} Text too long (>= 1500 characters):\n\n${text}`);

      return interaction.reply({
        content: "That's way too long. Shorten it down and keep it concise!",
        ephemeral: true
      });
    }

    FreeBugMail.edit(interaction, text);
  }

  static get commandData(): ApplicationCommandOptionData {
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
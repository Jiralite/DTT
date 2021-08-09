import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";
import DTT from "../../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "complete";

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

    if (number === null) {
      this.DTT.freeBugMailLog(`${logText} Required parameter \`number\` was not supplied.`);

      return interaction.reply({
        content: "Error: required parameter did not have an argument.",
        ephemeral: true
      });
    }


    const FreeBugMail = this.DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      this.DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return interaction.reply({
        content: "Cannot find the Free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state === "DISABLED") {
      this.DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which has been disabled.`);

      return interaction.reply({
        content: "This Free BugMail request is disabled.",
        ephemeral: true
      });
    }

    if ((FreeBugMail.userId !== interaction.user.id && FreeBugMail.claimedById !== interaction.user.id) || FreeBugMail.state !== "PENDING") {
      this.DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which the account is not the author of or the claimer of.`);

      return interaction.reply({
        content: "This Free BugMail request cannot be completed.",
        ephemeral: true
      });
    }

    FreeBugMail.resolve(interaction, false);
  }

  static get commandData(): ApplicationCommandOptionData {
    return {
      type: "SUB_COMMAND",
      name: "complete",
      description: "Completes a Free BugMail request.",
      options: [
        {
          type: "INTEGER",
          name: "number",
          description: "The Free BugMail request # to complete.",
          required: true
        }
      ]
    };
  }
}
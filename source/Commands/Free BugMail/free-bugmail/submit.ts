import { ApplicationCommandOptionData, CommandInteraction } from "discord.js";
import DTT from "../../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "submit";

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

    const text = interaction.options.getString("text");

    if (text === null) {
      this.DTT.freeBugMailLog(`${logText} Required parameter \`text\` was not supplied.`);

      return interaction.reply({
        content: "Error: required parameter did not have an argument.",
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

    const message = await interaction.deferReply({
      fetchReply: true
    });

    const FreeBugMail = new this.DTT.FreeBugMail(this.DTT, {
      No: null,
      Timestamp: interaction.createdTimestamp,
      "Weekly Timestamp": interaction.createdTimestamp,
      "Message ID": message.id,
      "User ID": interaction.user.id,
      "Claimed By ID": null,
      Mentioned: null,
      State: null
    });

    FreeBugMail.create(interaction, text);
  }

  static get commandData(): ApplicationCommandOptionData {
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
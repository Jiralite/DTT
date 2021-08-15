import { CommandInteraction, CommandStructure } from "discord.js";
import DTT from "../../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "free-bugmail";

  constructor(DTT: DTT) {
    this.DTT = DTT;
  }

  async submit(interaction: CommandInteraction) {
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

  edit(interaction: CommandInteraction) {
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

  complete(interaction: CommandInteraction) {
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

  get commandData(): CommandStructure {
    const tester = this.DTT.role("Tester");
    if (tester === null) throw new ReferenceError("Could not find the Tester role.");

    return {
      applicationCommandData: {
        name: "free-bugmail",
        description: "The command for the Free BugMail queue!",
        type: "CHAT_INPUT",
        options: [
          {
            type: "SUB_COMMAND",
            name: "complete",
            description: "Completes a Free BugMail request.",
            options: [
              {
                type: "INTEGER",
                name: "number",
                description: "The Free BugMail request # to complete.",
                required: true,
                choices: []
              }
            ]
          },
          {
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
          },
          {
            type: "SUB_COMMAND",
            name: "submit",
            description: "Submits a Free BugMail request.",
            options: [
              {
                type: "STRING",
                name: "text",
                description: "The text to submit.",
                required: true,
                choices: []
              }
            ]
          }
        ],
        defaultPermission: false
      },
      permissions: [
        {
          id: tester.id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

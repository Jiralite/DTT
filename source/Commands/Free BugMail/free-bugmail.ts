import { CommandInteraction, CommandStructure, Constants, FreeBugMailCommand } from "discord.js";
import DTT from "../../Client/Client";

export default class implements FreeBugMailCommand {
  readonly name = "free-bugmail";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction, subcommand: string): Promise<void> {
    switch (subcommand) {
      case "submit":
        return await this.submit(interaction);
      case "edit":
        return await this.edit(interaction);
      case "complete":
        return await this.complete(interaction);
    }
  }

  async submit(interaction: CommandInteraction): Promise<void> {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` Slash Command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return await interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });
    }

    const text = interaction.options.getString("text");

    if (text === null) {
      DTT.freeBugMailLog(`${logText} Required parameter \`text\` was not supplied.`);

      return await interaction.reply({
        content: "Error: required parameter did not have an argument.",
        ephemeral: true
      });
    }

    if (text.length >= 1500) {
      DTT.freeBugMailLog(`${logText} Text too long (>= 1500 characters):\n\n${text}`);

      return await interaction.reply({
        content: "That's way too long. Shorten it down and keep it concise!",
        ephemeral: true
      });
    }

    const message = await interaction.deferReply({
      fetchReply: true
    });

    const FreeBugMail = new DTT.FreeBugMail({
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

  edit(interaction: CommandInteraction): void {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` Slash Command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });

      return;
    }

    const number = interaction.options.getInteger("number");
    const text = interaction.options.getString("text");

    if (number === null || text === null) {
      DTT.freeBugMailLog(`${logText} Required parameters \`number\` and \`text\` both not supplied.`);

      interaction.reply({
        content: "Error: required parameters did not have arguments.",
        ephemeral: true
      });

      return;
    }

    const FreeBugMail = DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });

      return;
    }

    if (FreeBugMail.userId !== interaction.user.id) {
      DTT.freeBugMailLog(`${logText} Attempted to edit #${FreeBugMail.No} which the account is not the author of.`);

      interaction.reply({
        content: "This Free BugMail request cannot be edited by you.",
        ephemeral: true
      });

      return;
    }

    if (FreeBugMail.state !== "OPEN") {
      DTT.freeBugMailLog(`${logText} Attempted to edit Free BugMail request #${FreeBugMail.No} which was not open.`);

      interaction.reply({
        content: "This Free BugMail request is not open.",
        ephemeral: true
      });

      return;
    }

    if (text.length >= 1500) {
      DTT.freeBugMailLog(`${logText} Text too long (>= 1500 characters):\n\n${text}`);

      interaction.reply({
        content: "That's way too long. Shorten it down and keep it concise!",
        ephemeral: true
      });

      return;
    }

    FreeBugMail.edit(interaction, text);
  }

  complete(interaction: CommandInteraction): void {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` Slash Command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });

      return;
    }

    const number = interaction.options.getInteger("number");

    if (number === null) {
      DTT.freeBugMailLog(`${logText} Required parameter \`number\` was not supplied.`);

      interaction.reply({
        content: "Error: required parameter did not have an argument.",
        ephemeral: true
      });

      return;
    }


    const FreeBugMail = DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      interaction.reply({
        content: "Cannot find the Free BugMail request.",
        ephemeral: true
      });

      return;
    }

    if (FreeBugMail.state === "DISABLED") {
      DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which has been disabled.`);

      interaction.reply({
        content: "This Free BugMail request is disabled.",
        ephemeral: true
      });

      return;
    }

    if ((FreeBugMail.userId !== interaction.user.id && FreeBugMail.claimedById !== interaction.user.id) || FreeBugMail.state !== "PENDING") {
      DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which the account is not the author of or the claimer of.`);

      interaction.reply({
        content: "This Free BugMail request cannot be completed.",
        ephemeral: true
      });

      return;
    }

    FreeBugMail.resolve(interaction, false);
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: this.name,
        description: "The command for the Free BugMail queue!",
        type: this.type,
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
          id: DTT.role("Tester").id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

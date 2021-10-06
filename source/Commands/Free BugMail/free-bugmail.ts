import { CommandInteraction, CommandStructure, Constants, FreeBugMailCommand } from "discord.js";
import DTT from "../../Client/Client.js";

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
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` slash command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return await interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });
    }

    const text = interaction.options.getString("text", true);

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

    return await FreeBugMail.create(interaction, text);
  }

  async edit(interaction: CommandInteraction): Promise<void> {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` slash command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return await interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });
    }

    const number = interaction.options.getInteger("number", true);
    const text = interaction.options.getString("text", true);
    const FreeBugMail = DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return await interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.userId !== interaction.user.id) {
      DTT.freeBugMailLog(`${logText} Attempted to edit #${FreeBugMail.No} which the account is not the author of.`);

      return await interaction.reply({
        content: "This Free BugMail request cannot be edited by you.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state !== "OPEN") {
      DTT.freeBugMailLog(`${logText} Attempted to edit Free BugMail request #${FreeBugMail.No} which was not open.`);

      return await interaction.reply({
        content: "This Free BugMail request is not open.",
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

    return await FreeBugMail.edit(interaction, text);
  }

  async complete(interaction: CommandInteraction): Promise<void> {
    const logText = `${interaction.user} interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` slash command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return await interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });
    }

    const number = interaction.options.getInteger("number", true);
    const FreeBugMail = DTT.freeBugMails.get(number);

    if (!FreeBugMail) {
      DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return await interaction.reply({
        content: "Cannot find the Free BugMail request.",
        ephemeral: true
      });
    }

    if (FreeBugMail.state === "DISABLED") {
      DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which has been disabled.`);

      return await interaction.reply({
        content: "This Free BugMail request is disabled.",
        ephemeral: true
      });
    }

    if ((FreeBugMail.userId !== interaction.user.id && FreeBugMail.claimedById !== interaction.user.id) || FreeBugMail.state !== "PENDING") {
      DTT.freeBugMailLog(`${logText} Attempted to complete Free BugMail request #${FreeBugMail.No} which the account is not the author of or the claimer of.`);

      return await interaction.reply({
        content: "This Free BugMail request cannot be completed.",
        ephemeral: true
      });
    }

    return await FreeBugMail.resolve(interaction, false);
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: this.name,
        description: "The command for the Free BugMail queue!",
        type: this.type,
        options: [
          {
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "complete",
            description: "Completes a Free BugMail request.",
            options: [
              {
                type: Constants.ApplicationCommandOptionTypes.INTEGER,
                name: "number",
                description: "The Free BugMail request # to complete.",
                required: true,
                choices: []
              }
            ]
          },
          {
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "edit",
            description: "Edits a Free BugMail request.",
            options: [
              {
                type: Constants.ApplicationCommandOptionTypes.INTEGER,
                name: "number",
                description: "The Free BugMail request # to edit.",
                required: true
              },
              {
                type: Constants.ApplicationCommandOptionTypes.STRING,
                name: "text",
                description: "The new content of the Free BugMail request.",
                required: true
              }
            ]
          },
          {
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "submit",
            description: "Submits a Free BugMail request.",
            options: [
              {
                type: Constants.ApplicationCommandOptionTypes.STRING,
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
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        }
      ]
    };
  }
}

import { CommandInteraction, Constants } from "discord.js";
import DTT from "../../Client/Client.js";
import FreeBugMail from "../../Client/FreeBugMail.js";
import type { Command, CommandStructure } from "../index.js";

export default class implements Command {
  readonly name = "free-bugmail";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction<"cached">): Promise<void> {
    switch (interaction.options.getSubcommand()) {
      case "submit":
        return await this.submit(interaction);
      case "edit":
        return await this.edit(interaction);
      case "complete":
        return await this.complete(interaction);
    }
  }

  async submit(interaction: CommandInteraction<"cached">): Promise<void> {
    const logText = `${
      interaction.user
    } interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` slash command.`;
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

    const { id } = await interaction.deferReply({ fetchReply: true });
    return await FreeBugMail.create(interaction, text, id);
  }

  async edit(interaction: CommandInteraction<"cached">): Promise<void> {
    const logText = `${
      interaction.user
    } interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` slash command.`;
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
    const freeBugMail = FreeBugMail.cache.get(number);

    if (!freeBugMail) {
      DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return await interaction.reply({
        content: "Cannot find the free BugMail request.",
        ephemeral: true
      });
    }

    if (freeBugMail.userId !== interaction.user.id) {
      DTT.freeBugMailLog(`${logText} Attempted to edit #${freeBugMail.No} which the account is not the author of.`);

      return await interaction.reply({
        content: "This Free BugMail request cannot be edited by you.",
        ephemeral: true
      });
    }

    if (!freeBugMail.isOpen()) {
      DTT.freeBugMailLog(`${logText} Attempted to edit Free BugMail request #${freeBugMail.No} which was not open.`);

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

    return await freeBugMail.edit(interaction, text);
  }

  async complete(interaction: CommandInteraction<"cached">): Promise<void> {
    const logText = `${
      interaction.user
    } interacted with the \`/free-bugmail ${interaction.options.getSubcommand()}\` slash command.`;
    const bugmailQueue = DTT.channel("bugmail-queue");

    if (interaction.channelId !== bugmailQueue.id) {
      DTT.freeBugMailLog(`${logText} Wrong channel: ${interaction.channel}`);

      return await interaction.reply({
        content: `Please use this command in ${bugmailQueue}.`,
        ephemeral: true
      });
    }

    const number = interaction.options.getInteger("number", true);
    const freeBugMail = FreeBugMail.cache.get(number);

    if (!freeBugMail) {
      DTT.freeBugMailLog(`${logText} Could not find provided Free BugMail request number ${number}.`);

      return await interaction.reply({
        content: "Cannot find the Free BugMail request.",
        ephemeral: true
      });
    }

    if (freeBugMail.isDisabled()) {
      DTT.freeBugMailLog(
        `${logText} Attempted to complete Free BugMail request #${freeBugMail.No} which has been disabled.`
      );

      return await interaction.reply({
        content: "This Free BugMail request is disabled.",
        ephemeral: true
      });
    }

    if (
      (freeBugMail.userId !== interaction.user.id && freeBugMail.claimedById !== interaction.user.id) ||
      !freeBugMail.isPending()
    ) {
      DTT.freeBugMailLog(
        `${logText} Attempted to complete Free BugMail request #${freeBugMail.No} which the account is not the author nor claimer of.`
      );

      return await interaction.reply({
        content: "This Free BugMail request cannot be completed.",
        ephemeral: true
      });
    }

    return await freeBugMail.resolve(interaction, false);
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
                choices: [],
                minValue: 1
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
                required: true,
                minValue: 1
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
          id: DTT.role("Admin").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("DT Staff").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("Moderator").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("Tester").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        }
      ]
    };
  }
}

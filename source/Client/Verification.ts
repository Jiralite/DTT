import {
  ButtonInteraction,
  Constants,
  DiscordAPIError,
  GuildMember,
  MessageActionRow,
  MessageButton,
  Role,
  Snowflake,
  TextChannel
} from "discord.js";

import DTT from "./Client.js";

export type VerificationType = "TESTER" | "EMPLOYEE" | "ALT" | "DENY";

// eslint-disable-next-line unicorn/no-static-only-class
export default class Verification {
  static async sendVerification(guildMember: GuildMember): Promise<void> {
    const verificationMessage = await (DTT.channel("verification") as TextChannel).send(
      `Welcome to **${guildMember.guild.name}**, ${guildMember}! Please review the ${DTT.channel(
        "read-me"
      )} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to <@873604718893617203>!`
    );
    const actionRow = new MessageActionRow();
    const button = new MessageButton();
    const button2 = new MessageButton();
    const button3 = new MessageButton();
    const button4 = new MessageButton();
    button.setCustomId(`TESTER-${guildMember.user.id}-${verificationMessage.id}`);
    button.setLabel("Tester");
    button.setStyle(Constants.MessageButtonStyles.PRIMARY);
    button2.setCustomId(`EMPLOYEE-${guildMember.user.id}-${verificationMessage.id}`);
    button2.setLabel("Discord Employee");
    button2.setStyle(Constants.MessageButtonStyles.PRIMARY);
    button3.setCustomId(`ALT-${guildMember.user.id}-${verificationMessage.id}`);
    button3.setLabel("Alt Account");
    button3.setStyle(Constants.MessageButtonStyles.SECONDARY);
    button4.setCustomId(`DENY-${guildMember.user.id}-${verificationMessage.id}`);
    button4.setLabel("Deny");
    button4.setStyle(Constants.MessageButtonStyles.DANGER);
    actionRow.addComponents(button, button2, button3, button4);

    DTT.inviteLog({
      components: [actionRow],
      content: `${guildMember} (${guildMember.user.tag}) has joined the server.`
    });
  }

  static async authorise(
    interaction: ButtonInteraction<"cached">,
    authentication: VerificationType,
    guildMemberId: Snowflake,
    verificationMessageId: Snowflake
  ): Promise<void> {
    try {
      const guildMember = await DTT.guild.members.fetch(guildMemberId);
      const verification = DTT.channel("verification") as TextChannel;
      let role: Role;
      let verificationString = "a";

      switch (authentication) {
        case "TESTER":
          role = DTT.role("Tester");
          break;
        case "EMPLOYEE":
          role = DTT.role("Discord Employee");
          break;
        case "ALT":
          role = DTT.role("Alt Account");
          verificationString = "an";
          break;
        case "DENY":
          await guildMember.kick();
          await interaction.message.edit({ components: [] });
          await interaction.reply(
            `${interaction.user} (${interaction.user.tag}) Denied ${guildMember} (${guildMember.user.tag}) access to this server.`
          );
          await verification.messages.delete(verificationMessageId);
          return;
      }

      if (guildMember.pending) {
        return await interaction.reply({
          content: `${guildMember} has not yet passed membership screening.`,
          ephemeral: true
        });
      }

      await guildMember.roles.add([DTT.role("Member"), role]);
      await interaction.message.edit({ components: [] });

      await interaction.reply({
        content: `You have verified ${guildMember} as ${verificationString} ${role.name}.`,
        ephemeral: true
      });

      DTT.inviteLog(
        `${interaction.user} (${interaction.user.tag}) has verified ${guildMember} (${guildMember.user.tag}) as ${verificationString} ${role.name}.`
      );
      await verification.messages.delete(verificationMessageId);
      if (authentication !== "ALT")
        await (DTT.channel("general") as TextChannel).send(
          `Welcome to **${DTT.guild.name}**, ${guildMember}! Be sure to check out the channels in this server!`
        );
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        if (error.code === Constants.APIErrors.MISSING_PERMISSIONS) {
          interaction.reply({
            content: "Mising permissions.",
            ephemeral: true
          });

          return;
        }

        if (error.code === Constants.APIErrors.UNKNOWN_MEMBER) {
          interaction.message.edit({ components: [] });

          interaction.reply({
            content: "Unknown member.",
            ephemeral: true
          });

          return;
        }
      }

      return interaction.reply({
        content: "Error verifying guild member.",
        ephemeral: true
      });
    }
  }
}

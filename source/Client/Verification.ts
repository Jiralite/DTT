import { ButtonInteraction, Constants, DiscordAPIError, Formatters, GuildMember, MessageActionRow, MessageButton, Snowflake, TextChannel } from "discord.js";
import DTT from "./Client.js";

export type VerificationType = "TESTER" | "ALT" | "DENY";

export default class Verification {
  static sendVerification(guildMember: GuildMember): void {
    const actionRow = new MessageActionRow();
    const button = new MessageButton();
    const button2 = new MessageButton();
    const button3 = new MessageButton();
    button.setCustomId(`TESTER-${guildMember.user.id}`);
    button.setLabel("Tester");
    button.setStyle(Constants.MessageButtonStyles.PRIMARY);
    button2.setCustomId(`ALT-${guildMember.user.id}`);
    button2.setLabel("Alt Account");
    button2.setStyle(Constants.MessageButtonStyles.SECONDARY);
    button3.setCustomId(`DENY-${guildMember.user.id}`);
    button3.setLabel("Deny");
    button3.setStyle(Constants.MessageButtonStyles.DANGER);
    actionRow.addComponents(button, button2, button3);

    (DTT.channel("verification") as TextChannel).send({
      content: `Welcome to **${guildMember.guild.name}**, ${guildMember}! Please review the ${DTT.channel("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to <@873604718893617203>!`,
      components: [
        actionRow
      ]
    });
  }

  static async authorise(interaction: ButtonInteraction<"cached">, authentication: VerificationType, guildMemberId: Snowflake): Promise<void> {
    if (!interaction.member.roles.cache.hasAny(...DTT.modRoles.map((modRole => modRole.id)))) {
      DTT.log(`${interaction.user} interacted with a verification button but failed authorisation checks.`);

      return interaction.reply({
        content: "You do not have permission to perform this interaction.",
        ephemeral: true
      });
    }

    try {
      const affectedGuildMember = await DTT.guild.members.fetch(guildMemberId);

      switch (authentication) {
        case "TESTER":
          return Verification.authoriseTester(interaction, affectedGuildMember);
        case "ALT":
          return Verification.authoriseAlt(interaction, affectedGuildMember);
        case "DENY":
          return Verification.authoriseKick(interaction, affectedGuildMember);
      }
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        if (error.code === Constants.APIErrors.UNKNOWN_MEMBER) {
          const guildMemberManualMention = Formatters.userMention(guildMemberId);
          DTT.log(`Error during verification: ${guildMemberManualMention} no longer in server.`);

          interaction.update({
            components: [],
            content: `${guildMemberManualMention} appears to no longer be in the server.`
          }).then(() => setTimeout(() => interaction.message.delete().catch(() => null), 10000));

          return;
        }
      }

      DTT.log("Error fetching guild member.");

      return interaction.reply({
        content: "Error fetching guild member.",
        ephemeral: true
      });
    }
  }

  static authoriseTester(interaction: ButtonInteraction<"cached">, guildMember: GuildMember): void {
    const tester = DTT.role("Tester");

    guildMember.roles.add(tester).then(() => {
      DTT.log(`${interaction.user} has verified ${guildMember} as a ${tester}.`);

      interaction.reply({
        content: `You have given the ${tester} role to ${guildMember}.`,
        ephemeral: true
      });

      interaction.message.delete().catch(() => null);
      (DTT.channel("general") as TextChannel).send(`Welcome to **${DTT.guild.name}**, ${guildMember}! Be sure to check out the channels in this server!`);
    }).catch(error => {
      DTT.log(`Error adding role to ${guildMember}.`, error);

      interaction.reply({
        content: "Error adding role to guild member.",
        ephemeral: true
      });
    });
  }

  static authoriseAlt(interaction: ButtonInteraction<"cached">, guildMember: GuildMember): void {
    const altAccount = DTT.role("Alt Account");

    guildMember.roles.add(altAccount).then(() => {
      DTT.log(`${interaction.user} has verified ${guildMember} as an ${altAccount}.`);

      interaction.reply({
        content: `You have given the ${altAccount} role to ${guildMember}.`,
        ephemeral: true
      });

      interaction.message.delete().catch(() => null);
    }).catch(error => {
      DTT.log(`Error adding role to ${guildMember}.`, error);

      interaction.reply({
        content: "Error adding role to guild member.",
        ephemeral: true
      });
    });
  }

  static authoriseKick(interaction: ButtonInteraction<"cached">, guildMember: GuildMember): void {

    guildMember.kick().then(() => {
      DTT.log(`${interaction.user} has removed ${guildMember} from this guild - failed verification.`);
      interaction.reply(`${interaction.user} has kicked ${guildMember}.`);
      interaction.message.delete().catch(() => null);
      setTimeout(() => interaction.deleteReply().catch(() => null), 60000);
    }).catch(error => {
      DTT.log(`Error removing ${guildMember} from this guild.`, error);

      interaction.reply({
        content: "Error kicking guild member.",
        ephemeral: true
      });
    });
  }
}

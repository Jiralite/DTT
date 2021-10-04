import { ButtonInteraction, Constants, DiscordAPIError, GuildMember, Message, Role, Snowflake, TextChannel, VerificationType } from "discord.js";
import DTT from "./Client";

export default class Verification {
  static sendVerification(guildMember: GuildMember): void {

    (DTT.channel("verification") as TextChannel).send({
      content: `Welcome to **${guildMember.guild.name}**, ${guildMember}! Please review the ${DTT.channel("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to <@873604718893617203>!`,
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Tester",
              customId: `TESTER-${guildMember.user.id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Alt Account",
              customId: `ALT-${guildMember.user.id}`,
              style: "SECONDARY"
            },
            {
              type: "BUTTON",
              label: "Deny",
              customId: `DENY-${guildMember.user.id}`,
              style: "DANGER"
            }
          ]
        }
      ]
    });
  }

  static async authorise(interaction: ButtonInteraction, authentication: VerificationType, guildMemberId: Snowflake): Promise<void> {
    const modRoles = DTT.modRoles;

    if (modRoles.some(modRole => modRole === null)) {
      DTT.log("Could not locate the moderators. One or more roles could not be found.");

      interaction.reply({
        content: "Couldn't locate the moderators. Is this server civil?",
        ephemeral: true
      });

      return;
    }

    if (!(interaction.member as GuildMember).roles.cache.hasAny(...modRoles.map((modRole => (modRole as Role).id)))) {
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
          return DTT.Verification.authoriseTester(interaction, affectedGuildMember);
        case "ALT":
          return DTT.Verification.authoriseAlt(interaction, affectedGuildMember);
        case "DENY":
          return DTT.Verification.authoriseKick(interaction, affectedGuildMember);
      }
    } catch (error) {
      if (error instanceof DiscordAPIError) {
        if (error.code === Constants.APIErrors.UNKNOWN_MEMBER) {
          const guildMemberManualMention = `<@${guildMemberId}>`;
          DTT.log(`Error during verification: ${guildMemberManualMention} no longer in server.`);

          interaction.update({
            content: `${guildMemberManualMention} no longer appears to be in the server.`,
            components: []
          }).then(() => setTimeout(() => (interaction.message as Message).delete().catch(() => null), 10000));

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

  static authoriseTester(interaction: ButtonInteraction, guildMember: GuildMember): void {
    const tester = DTT.role("Tester");

    guildMember.roles.add(tester).then(() => {
      DTT.log(`${interaction.user} has verified ${guildMember} as a ${tester}.`);

      interaction.reply({
        content: `You have given the ${tester} role to ${guildMember}.`,
        ephemeral: true
      });

      (interaction.message as Message).delete().catch(() => null);
      (DTT.channel("general") as TextChannel).send(`Welcome to **${DTT.guild.name}**, ${guildMember}! Be sure to check out the channels in this server!`);
    }).catch(error => {
      DTT.log(`Error adding role to ${guildMember}.`, error);

      interaction.reply({
        content: "Error adding role to guild member.",
        ephemeral: true
      });
    });
  }

  static authoriseAlt(interaction: ButtonInteraction, guildMember: GuildMember): void {
    const altAccount = DTT.role("Alt Account");

    guildMember.roles.add(altAccount).then(() => {
      DTT.log(`${interaction.user} has verified ${guildMember} as an ${altAccount}.`);

      interaction.reply({
        content: `You have given the ${altAccount} role to ${guildMember}.`,
        ephemeral: true
      });

      (interaction.message as Message).delete().catch(() => null);
    }).catch(error => {
      DTT.log(`Error adding role to ${guildMember}.`, error);

      interaction.reply({
        content: "Error adding role to guild member.",
        ephemeral: true
      });
    });
  }

  static authoriseKick(interaction: ButtonInteraction, guildMember: GuildMember): void {

    guildMember.kick().then(() => {
      DTT.log(`${interaction.user} has removed ${guildMember} from this guild - failed verification.`);
      interaction.reply(`${interaction.user} has kicked ${guildMember}.`);
      (interaction.message as Message).delete().catch(() => null);
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

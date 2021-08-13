import { ButtonInteraction, GuildMember, Message, Snowflake, TextChannel, VerificationType } from "discord.js";
import DTT from "./Client";

export default class Verification {
  static sendVerification(guildMember: GuildMember) {
    const DTT = guildMember.client as DTT;

    (DTT.kanal("verification") as TextChannel).send({
      content: `Welcome to **${guildMember.guild.name}**, ${guildMember}! Please review the ${DTT.kanal("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to ${DTT.user}!`,
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

  static async authorise(interaction: ButtonInteraction, authentication: VerificationType, guildMemberId: Snowflake) {
    const DTT = interaction.client as DTT;

    if (!(interaction.member as GuildMember).roles.cache.hasAny(...DTT.modRoles.map(({ id }) => id))) {
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
      if (error.code === 10007 && error.httpStatus === 404) {
        const guildMemberManualMention = `<@${guildMemberId}>`;
        DTT.log(`Error during verification: ${guildMemberManualMention} no longer in server.`);

        return interaction.update({
          content: `${guildMemberManualMention} no longer appears to be in the server.`,
          components: []
        }).then(() => setTimeout(() => (interaction.message as Message).delete().catch(() => null), 10000));
      }

      DTT.log("Error fetching guild member.");

      return interaction.reply({
        content: "Error fetching guild member.",
        ephemeral: true
      });
    }
  }

  static authoriseTester(interaction: ButtonInteraction, guildMember: GuildMember) {
    const DTT = interaction.client as DTT;
    const tester = DTT.role("Tester");

    if (tester === null) {
      DTT.log(`Error adding role to ${guildMember}. Apparently, the Tester role cannot be found.`);
      interaction.reply(`There was an error authorising ${guildMember}`);
      return;
    }
    
    guildMember.roles.add(tester).then(() => {
      DTT.log(`${interaction.user} has verified ${guildMember} as a ${tester}.`);

      interaction.reply({
        content: `You have given the ${tester} role to ${guildMember}.`,
        ephemeral: true
      });

      (interaction.message as Message).delete().catch(() => null);
      (DTT.kanal("general") as TextChannel).send(`Welcome to **${DTT.guild.name}**, ${guildMember}! Be sure to check out the channels in this server!`);
    }).catch(error => {
      DTT.log(`Error adding role to ${guildMember}.`, error);

      interaction.reply({
        content: "Error adding role to guild member.",
        ephemeral: true
      });
    });
  }

  static authoriseAlt(interaction: ButtonInteraction, guildMember: GuildMember) {
    const DTT = interaction.client as DTT;
    const altAccount = DTT.role("Alt Account");

    if (altAccount === null) {
      DTT.log(`Error adding role to ${guildMember}. Apparently, the Alt Account role cannot be found.`);
      interaction.reply(`There was an error authorising ${guildMember}`);
      return;
    }

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

  static authoriseKick(interaction: ButtonInteraction, guildMember: GuildMember) {
    const DTT = interaction.client as DTT;

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
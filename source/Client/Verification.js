class Verification {
  static sendVerification(guildmember) {
    guildmember.client.kanal("verification").send({
      content: `Welcome to **${guildmember.guild.name}**, ${guildmember}! Please review the ${guildmember.client.kanal("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to ${guildmember.client.user}!`,
      components: [
        [
          {
            type: "BUTTON",
            label: "Tester",
            customID: `Tester-${guildmember.id}`,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Alt Account",
            customID: `Alt-${guildmember.id}`,
            style: "SECONDARY"
          },
          {
            type: "BUTTON",
            label: "Deny",
            customID: `Deny-${guildmember.id}`,
            style: "DANGER"
          }
        ]
      ]
    });
  }

  static async authorise(interaction, authentication, guildmemberId) {
    if (!interaction.member.roles.cache.some(({ id }) => [
      interaction.client.role("Admin").id,
      interaction.client.role("Moderator").id,
      interaction.client.role("DT Staff").id,
      interaction.client.role("DT Mod or BA").id
    ].includes(id))) {
      interaction.client.log(`${interaction.user} interacted with a verification button but failed authorisation checks.`);

      return interaction.reply({
        content: "You do not have permission to perform this interaction.",
        ephemeral: true
      });
    }

    try {
      const guildmember = await interaction.client.guild.members.fetch(guildmemberId);

      switch (authentication) {
        case "Tester":
          return interaction.client.Verification.authoriseTester(interaction, guildmember);
        case "Alt":
          return interaction.client.Verification.authoriseAlt(interaction, guildmember);
        case "Deny":
          return interaction.client.Verification.authoriseKick(interaction, guildmember);
      }
    } catch (error) {
      let errorString = "Error fetching guildmember";

      if (error.code === 10007 && error.httpStatus === 404) {
        errorString += ": guildmember no longer in server.";
        interaction.client.log(errorString);

        return interaction.update({
          content: `<@${guildmemberId}> no longer appears to be in the server.`,
          components: []
        }).then(() => setTimeout(() => interaction.message.delete().catch(() => null), 5000));
      }

      errorString += ".";
      interaction.client.log(errorString);

      return interaction.reply({
        content: "Error fetching guildmember.",
        ephemeral: true
      });
    }
  }

  static authoriseTester(interaction, guildmember) {
    guildmember.roles.add(guildmember.client.role("Tester")).then(() => {
      interaction.client.log(`${interaction.user} has verified ${guildmember} as a ${guildmember.client.role("Tester")}.`);

      interaction.reply({
        content: `You have given the ${guildmember.client.role("Tester")} role to ${guildmember}.`,
        ephemeral: true
      });

      interaction.message.delete().catch(error => null);
      guildmember.client.kanal("general").send(`Welcome to **${guildmember.client.guild.name}**, ${guildmember}! Be sure to check out ${guildmember.client.kanal("roles")} and other channels!`);
    }).catch(error => {
      interaction.client.log(`Error adding role to ${guildmember}.`, error);

      interaction.reply({
        content: "Error adding role to guildmember.",
        ephemeral: true
      });
    });
  }

  static authoriseAlt(interaction, guildmember) {
    guildmember.roles.add(guildmember.client.role("Alt Account")).then(() => {
      interaction.client.log(`${interaction.user} has verified ${guildmember} as an ${guildmember.client.role("Alt Account")}.`);

      interaction.reply({
        content: `You have given the ${guildmember.client.role("Alt Account")} role to ${guildmember}.`,
        ephemeral: true
      });

      interaction.message.delete().catch(error => null);
    }).catch(error => {
      interaction.client.log(`Error adding role to ${guildmember}.`, error);

      interaction.reply({
        content: "Error adding role to guildmember.",
        ephemeral: true
      });
    });
  }

  static authoriseKick(interaction, guildmember) {
    guildmember.kick().then(() => {
      interaction.client.log(`${interaction.user} has removed ${guildmember} from this guild - failed verification.`);
      interaction.reply(`${interaction.user} has kicked ${guildmember}.`);
      interaction.message.delete().catch(error => null);
      setTimeout(() => interaction.deleteReply().catch(error => null), 60000);
    }).catch(error => {
      interaction.client.log(`Error removing ${guildmember} from this guild.`, error);

      interaction.reply({
        content: "Error kicking guildmember.",
        ephemeral: true
      });
    });
  }
}

module.exports = Verification;

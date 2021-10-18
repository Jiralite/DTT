import DTT from "./Client/Client.js";
import { CommandName, Constants, GuildMember, Role, RoleCategories, RolesCommand, Snowflake, SubRoleCategories, VerificationType } from "discord.js";
import ready from "./Events/ready.js";

DTT.once(Constants.Events.CLIENT_READY, ready);

DTT.on(Constants.Events.GUILD_MEMBER_UPDATE, (oldGuildmember, newGuildmember) => {
  if (oldGuildmember.guild.id !== DTT.guild.id) return;
  if (oldGuildmember.pending === true && newGuildmember.pending === false) DTT.Verification.sendVerification(newGuildmember);
});

DTT.on(Constants.Events.INTERACTION_CREATE, async interaction => {
  if (interaction.guildId !== DTT.guild.id) return;

  if (interaction.isCommand()) {
    const commandName = interaction.commandName;
    const command = DTT.commands[commandName as CommandName];

    if (!command) {
      interaction.reply({
        content: "your ban has been scheduled for tomorrow",
        ephemeral: true
      });

      return;
    }

    try {
      await command.handle(interaction, interaction.options.getSubcommand(false));
    } catch (error) {
      DTT.log(`Error running command "${commandName}".`, error);
      const errorMessage = "An error was encountered. It's being tracked.";

      if (interaction.deferred || interaction.replied) {
        interaction.followUp({
          content: errorMessage,
          ephemeral: true
        });
      } else {
        interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      }
    }

    return;
  }

  if (interaction.isContextMenu()) {
    interaction.reply({
      content: "your ban has been scheduled for tomorrow",
      ephemeral: true
    });

    return;
  }

  if (interaction.isButton()) {
    const joiner = /(TESTER|ALT|DENY)-(\d+)/.exec(interaction.customId);
    if (joiner) return DTT.Verification.authorise(interaction, (joiner[1] as VerificationType), (joiner[2] as Snowflake));
    if (interaction.customId === "SELFROLE_BACK") return DTT.commands.roles.handle(interaction);
    const roleAssignment = /SELFROLE-(\d+)/.exec(interaction.customId);

    if (roleAssignment) {
      const role = DTT.guild.roles.resolve(roleAssignment[1]) as Role;
      const member = interaction.member as GuildMember;

      if (member.roles.cache.has(role.id)) {
        member.roles.remove(role).then(() => interaction.reply({
          content: `The ${role} role has been removed from you!`,
          ephemeral: true
        })).catch(error => {
          DTT.log("Error in self-role removal.", error);

          interaction.reply({
            content: "There was an error during self-role removal.",
            ephemeral: true
          });
        });
      } else {
        member.roles.add(role).then(() => interaction.reply({
          content: `The ${role} role has been added to you!`,
          ephemeral: true
        })).catch(error => {
          DTT.log("Error in self-role addition.", error);

          interaction.reply({
            content: "There was an error during self-role addition.",
            ephemeral: true
          });
        });
      }
    }

    if (interaction.customId === "Free BugMail") return DTT.FreeBugMail.addRole(interaction);
    if (interaction.customId === "No Free BugMail") return DTT.FreeBugMail.removeRole(interaction);
    const claimRequest = /(\d+)-(PRECLAIM|CLAIM|BUGMAILED|RESTORE)/.exec(interaction.customId);

    if (claimRequest && (interaction.channelId === DTT.channel("bugmail-queue").id || interaction.channelId === DTT.channel("bugmail-discussion").id)) {
      if (claimRequest[2] === "PRECLAIM") return DTT.freeBugMails.get(+claimRequest[1])?.preClaim(interaction);
      if (claimRequest[2] === "CLAIM") return DTT.freeBugMails.get(+claimRequest[1])?.claim(interaction);
      if (claimRequest[2] === "BUGMAILED") return DTT.freeBugMails.get(+claimRequest[1])?.alreadyBugMailed(interaction);
      if (claimRequest[2] === "RESTORE") return DTT.freeBugMails.get(+claimRequest[1])?.restore(interaction);
    }

    const weekBugMail = /(\d+)-(PENDING|RESOLVED)/.exec(interaction.customId);

    if (weekBugMail) {
      const FreeBugMail = DTT.freeBugMails.get(+weekBugMail[1]);
      if (!FreeBugMail) return;

      if (interaction.user.id !== FreeBugMail.claimedById) {
        return interaction.reply({
          content: `We're currently awaiting the response of <@${FreeBugMail.claimedById}> right now, not you!`,
          ephemeral: true
        });
      }

      if (weekBugMail[2] === "PENDING") return FreeBugMail.resumePendingTimeout(interaction);
      if (weekBugMail[2] === "RESOLVED") return FreeBugMail.resolvePendingTimeout(interaction);
    }
  }

  if (interaction.isSelectMenu()) {
    if (interaction.customId === "SELFROLE_CATEGORY") return (DTT.commands.roles as RolesCommand)?.categoryInteraction(interaction, interaction.values[0] as RoleCategories);
    if (!interaction.customId.startsWith("SELFROLE")) return;
    const roles: Role[] = interaction.values.map(id => DTT.guild.roles.resolve(id) as Role);

    if (roles.some(role => role === null)) {
      DTT.log("Error during self-role. Detected role ids that couldn't be found.");

      return interaction.reply({
        content: "Error: detected a role that couldn't be found.",
        ephemeral: true
      });
    }

    const guildMember = interaction.member as GuildMember;
    const rolesToSet = guildMember.roles.cache.clone();
    const rolesAdded: Role[] = [];
    const rolesRemoved: Role[] = [];

    for (const role of roles) {
      if (!rolesToSet.has(role.id)) {
        rolesToSet.set(role.id, role);
        rolesAdded.push(role);
      }
    }

    for (const { role } of (DTT.commands.roles as RolesCommand).resolveSelectMenuCategoryRoles(interaction.customId.slice(9) as SubRoleCategories).filter(({ role }) => !roles.some(({ id }) => id === role.id))) {
      if (rolesToSet.has(role.id)) {
        rolesToSet.delete(role.id);
        rolesRemoved.push(role);
      }
    }

    guildMember.roles.set(rolesToSet).then(() => {
      interaction.reply({
        content: `Roles added: ${rolesAdded.join(" & ") || "None."}\nRoles removed: ${rolesRemoved.join(" & ") || "None."}`,
        ephemeral: true
      });
    }).catch(error => {
      DTT.log("Error during applying self-roles.", error);

      interaction.reply({
        content: "There was an error applying self-roles.",
        ephemeral: true
      });
    });
  }
});

DTT.on(Constants.Events.INVITE_DELETE, invite => DTT.invites.find(({ code }) => code === invite.code)?.remove());

DTT.on(Constants.Events.MESSAGE_CREATE, message => {
  if (message.author.bot || message.channel.type === "DM") return;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guildMember = message.member!;

  if (message.channel.id === DTT.channel("bugmail-queue").id) {
    if (!message.channel.permissionsFor(guildMember).has("MANAGE_MESSAGES") && message.author.id !== DTT.user.id) message.delete();
  }
});

DTT.on(Constants.Events.MESSAGE_DELETE, message => {
  if (message.guild?.id !== DTT.guild.id) return;

  for (const FreeBugMail of DTT.freeBugMails.values()) {
    if (FreeBugMail.messageId === message.id && FreeBugMail.state !== "RESOLVED") return FreeBugMail.remove();

    if (FreeBugMail.disabledMessageId === message.id) {
      FreeBugMail.disabledMessageId = null;
      return;
    }
  }
});

DTT.login(process.env.DISCORD_TOKEN);

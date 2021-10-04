import DTT from "./Client/Client.js";
import { CommandName, Constants, DiscordAPIError, FreeBugMailData, GuildMember, InviteData, Role, RoleCategories, RolesCommand, Snowflake, SubRoleCategories, VerificationType } from "discord.js";
import { MysqlError } from "mysql";

function Maria() {
  DTT.Maria.getConnection(error => {
    if (!error) {
      collectFreeBugMails();
      collectInvites();
      DTT.log("Maria established.");
    } else {
      DTT.log("Maria connection error: Retrying in 1 minute.", error);
      setTimeout(Maria, 60000);
    }
  });
}

function collectFreeBugMails() {
  DTT.Maria.query("SELECT * FROM `Free BugMails`", (_E: MysqlError, R: FreeBugMailData[]) => R.forEach(freeBugMail => {
    const FreeBugMail = new DTT.FreeBugMail(freeBugMail);
    DTT.freeBugMails.set(FreeBugMail.No as number, FreeBugMail);
    FreeBugMail.timeout();
    FreeBugMail.mentionedTimeout();
  }));
}

function collectInvites() {
  DTT.Maria.query("SELECT * FROM `Invites`", (_E: MysqlError, R: InviteData[]) => R.forEach(invite => {
    const Invite = new DTT.Invite(invite);
    DTT.invites.set(Invite.No as number, Invite);
    Invite.expireTimeout();
  }));
}

DTT.on(Constants.Events.CLIENT_READY, () => {
  DTT.log("Selflessly slaving away.");
  Maria();
});

DTT.on(Constants.Events.GUILD_MEMBER_ADD, async guildMember => {
  if (guildMember.guild.id !== DTT.BBAGuild.id) return;

  try {
    const tester = DTT.role("Tester");
    if (tester === null) throw new ReferenceError("Couldn't find the tester role.");
    const DTTGuildMember = await DTT.guild.members.fetch(guildMember);
    const role = guildMember.guild.roles.resolve("816059251045695558") as Role; // Access role in the Bug Bombing Area guild
    if (DTTGuildMember.roles.cache.has(tester.id)) await guildMember.roles.add(role);
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      if (error.code === Constants.APIErrors.UNKNOWN_MEMBER) {
        DTT.log(`${guildMember} joined ${guildMember.guild.name} but was not found in this server.`, error);
        return;
      }

      if (error.code === Constants.APIErrors.MISSING_PERMISSIONS) {
        DTT.log(`${guildMember} joined ${guildMember.guild.name} but lacked permissions to authorise them.`, error);
        return;
      }
    }

    DTT.log(`An error occured whilst authorising ${guildMember} in ${guildMember.guild.name}.`, error);
  }
});

DTT.on(Constants.Events.GUILD_MEMBER_REMOVE, async guildMember => {
  if (guildMember.guild.id !== DTT.guild.id) return;

  try {
    await DTT.BBAGuild.members.fetch(guildMember as GuildMember).then(BBAGuildMember => BBAGuildMember.kick(`No longer in ${DTT.guild.name}.`));
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      if (error.code === Constants.APIErrors.UNKNOWN_MEMBER) return;

      if (error.code === Constants.APIErrors.MISSING_PERMISSIONS) {
        DTT.log(`${guildMember} left ${guildMember.guild.name} but lacked permissions to remove them from ${DTT.BBAGuild.name}.`, error);
        return;
      }
    }

    DTT.log(`An error occured whilst removing ${guildMember} from ${DTT.BBAGuild.name}.`, error);
  }
});

DTT.on(Constants.Events.GUILD_MEMBER_UPDATE, (oldGuildmember, newGuildmember) => {
  if (oldGuildmember.guild.id !== DTT.guild.id) return;
  if (oldGuildmember.pending === true && newGuildmember.pending === false) DTT.Verification.sendVerification(newGuildmember);
});

DTT.on(Constants.Events.INTERACTION_CREATE, interaction => {
  if (interaction.guildId !== DTT.guild.id) return;

  if (interaction.isCommand()) {
    const command = DTT.commands[interaction.commandName as CommandName];

    if (!command) {
      interaction.reply({
        content: "your ban has been scheduled for tomorrow",
        ephemeral: true
      });

      return;
    }

    command.handle(interaction, interaction.options.getSubcommand(false));
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

    if (claimRequest && (interaction.channelId === DTT.channel("bugmail-queue")?.id || interaction.channelId === DTT.channel("bugmail-discussion")?.id)) {
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

    for (const role of (DTT.commands.roles as RolesCommand).resolveSelectMenuCategoryRoles(interaction.customId.slice(9) as SubRoleCategories).filter((role: Role) => !roles.some(({ id }) => id === role.id))) {
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
  if (message.author.bot) return;
  const bugmailQueue = DTT.channel("bugmail-queue");
  if (bugmailQueue === null || message.channel.type === "DM") return;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guildMember = message.member!;

  if (message.channel.id === bugmailQueue.id) {
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

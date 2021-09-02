import { FreeBugMailData, GuildMember, InviteData, Role, RoleCategories, RolesCommand, Snowflake, SubRoleCategories, VerificationType } from "discord.js";
import { MysqlError } from "mysql";
import Client from "./Client/Client.js";

const DTT = new Client({
  partials: [
    "MESSAGE"
  ],
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_INVITES"
  ]
});

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
    const FreeBugMail = new DTT.FreeBugMail(DTT, freeBugMail);
    DTT.freeBugMails.set(FreeBugMail.No as number, FreeBugMail);
    FreeBugMail.timeout();
    FreeBugMail.mentionedTimeout();
  }));
}

function collectInvites() {
  DTT.Maria.query("SELECT * FROM `Invites`", (_E: MysqlError, R: InviteData[]) => R.forEach(invite => {
    const Invite = new DTT.Invite(DTT, invite);
    DTT.invites.set(Invite.No as number, Invite);
    Invite.expireTimeout();
  }));
}

DTT.on("guildMemberAdd", async guildMember => {
  if (guildMember.guild.id !== DTT.bbaGuild.id) return;

  try {
    const tester = DTT.role("Tester");
    if (tester === null) throw new ReferenceError("Couldn't find the tester role.");
    const DTTGuildMember = await DTT.guild.members.fetch(guildMember);
    const role = guildMember.guild.roles.resolve("816059251045695558") as Role; // Access role in the Bug Bombing Area guild
    if (DTTGuildMember.roles.cache.has(tester.id)) await guildMember.roles.add(role);
  } catch (error) {
    if (error.code === 10007) {
      DTT.log(`${guildMember} joined ${guildMember.guild.name} but was not found in this server.`, error);
      return;
    }

    if (error.code === 50013) {
      DTT.log(`${guildMember} joined ${guildMember.guild.name} but lacked permissions to authorise them.`, error);
      return;
    }

    DTT.log(`An error occured whilst authorising ${guildMember} in ${guildMember.guild.name}.`, error);
  }
});

DTT.on("guildMemberRemove", async guildMember => {
  if (guildMember.guild.id !== DTT.guild.id) return;

  try {
    await DTT.bbaGuild.members.fetch(guildMember as GuildMember).then(BBAGuildMember => BBAGuildMember.kick(`No longer in ${DTT.guild.name}.`));
  } catch (error) {
    if (error.code === 10007) return;

    if (error.code === 50013) {
      DTT.log(`${guildMember} left ${guildMember.guild.name} but lacked permissions to remove them from ${DTT.bbaGuild.name}.`, error);
      return;
    }

    DTT.log(`An error occured whilst removing ${guildMember} from ${DTT.bbaGuild.name}.`, error);
  }
});

DTT.on("guildMemberUpdate", (oldGuildmember, newGuildmember) => {
  if (oldGuildmember.guild.id !== DTT.guild.id) return;
  if (oldGuildmember.pending === true && newGuildmember.pending === false) DTT.Verification.sendVerification(newGuildmember);
});

DTT.on("interactionCreate", interaction => {
  if (interaction.guildId !== DTT.guild.id) return;

  if (interaction.isCommand()) {
    const command = DTT.commands.get(interaction.commandName);

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
    if (interaction.customId === "SELFROLE_BACK") return DTT.commands.get("roles")?.handle(interaction);
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

    if (claimRequest && (interaction.channelId === DTT.kanal("bugmail-queue")?.id || interaction.channelId === DTT.kanal("bugmail-discussion")?.id)) {
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
    if (interaction.customId === "SELFROLE_CATEGORY") return (DTT.commands.get("roles") as RolesCommand)?.categoryInteraction(interaction, interaction.values[0] as RoleCategories);
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

    for (const role of (DTT.commands.get("roles") as RolesCommand).resolveSelectMenuCategoryRoles(interaction.customId.slice(9) as SubRoleCategories).filter((role: Role) => !roles.some(({ id }) => id === role.id))) {
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

DTT.on("inviteDelete", invite => DTT.invites.find(({ code }) => code === invite.code)?.remove());

DTT.on("messageCreate", message => {
  if (message.author.bot) return;
  const bugmailQueue = DTT.kanal("bugmail-queue");
  if (bugmailQueue === null || message.channel.type === "DM") return;

  if (message.channel.id === bugmailQueue.id) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!message.channel.permissionsFor(message.author)?.has("MANAGE_MESSAGES") && message.author.id !== DTT.user!.id) message.delete();
  }
});

DTT.on("messageDelete", message => {
  if (message.guild!.id !== DTT.guild.id) return; // eslint-disable-line @typescript-eslint/no-non-null-assertion

  for (const FreeBugMail of DTT.freeBugMails.values()) {
    if (FreeBugMail.messageId === message.id && FreeBugMail.state !== "RESOLVED") return FreeBugMail.remove();

    if (FreeBugMail.disabledMessageId === message.id) {
      FreeBugMail.disabledMessageId = null;
      return;
    }
  }
});

DTT.on("ready", () => {
  DTT.log("Selflessly slaving away.");
  Maria();
});

DTT.login(process.env.DISCORD_TOKEN);

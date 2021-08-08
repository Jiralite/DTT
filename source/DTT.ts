import { GuildMember, TextChannel } from "discord.js";
import Client from "./Client/Client.js";
import Keys from "./Client/Keys.json";

const { discord: { token } } = Keys;

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
  DTT.Maria.query("SELECT * FROM `Free BugMails`", (_E: any, R: MariaFreeBugMail[]) => R.forEach(freeBugMail => {
    const FreeBugMail = new DTT.FreeBugMail(DTT, freeBugMail);
    DTT.freeBugMails.set(FreeBugMail.No, FreeBugMail);
    FreeBugMail.timeout();
    FreeBugMail.mentionedTimeout();
  }));
}

function collectInvites() {
  DTT.Maria.query("SELECT * FROM `Invites`", (_E: any, R: MariaInvite[]) => R.forEach(invite => {
    const Invite = new DTT.Invite(DTT, invite);
    DTT.invites.set(Invite.No, Invite);
    if (!Invite.expired) Invite.expireTimeout();
  }));
}

DTT.on("guildMemberAdd", async guildMember => {
	if (guildMember.guild.id !== DTT.bbaGuild.id) return;

  try {
    const DTTGuildMember = await DTT.guild.members.fetch(guildMember);
    const role = guildMember.guild.roles.resolve("816059251045695558"); // Access role in the Bug Bombing Area guild
    if (DTTGuildMember.roles.cache.has(DTT.role("Tester").id)) await guildMember.roles.add(role);
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
    await DTT.bbaGuild.members.fetch(guildMember).then(BBAGuildMember => BBAGuildMember.kick(`No longer in ${DTT.guild.name}.`));
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

DTT.on("interactionCreate", async interaction => {
  if (interaction.guildId !== DTT.guild.id) return;

  if (interaction.isCommand()) {
    let command = DTT.commands.get(interaction.commandName);
    if (!command) return;
    if (interaction.options.data[0]?.type === "SUB_COMMAND_GROUP") command = command.get(interaction.options.getSubcommandGroup()).get(interaction.options.getSubcommand());
    if (interaction.options.data[0]?.type === "SUB_COMMAND") command = command.get(interaction.options.getSubcommand());
    command.traditional(interaction);
    return;
  }

  if (interaction.isButton()) {
    const joiner = /(Tester|Alt|Deny)-(\d+)/.exec(interaction.customId);
    if (joiner) return DTT.Verification.authorise(interaction, joiner[1], joiner[2]);
    const roleAssignment = /ROLE-(\d+)/.exec(interaction.customId);

    if (roleAssignment) {
      const role = DTT.guild.roles.resolve(roleAssignment[1]);
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

    if (claimRequest && (interaction.channelId === DTT.kanal("bugmail-queue").id || interaction.channelId === DTT.kanal("bugmail-discussion").id)) {
      if (claimRequest[2] === "PRECLAIM") return DTT.freeBugMails.get(+claimRequest[1]).preClaim(interaction);
      if (claimRequest[2] === "CLAIM") return DTT.freeBugMails.get(+claimRequest[1]).claim(interaction);
      if (claimRequest[2] === "BUGMAILED") return DTT.freeBugMails.get(+claimRequest[1]).alreadyBugMailed(interaction);
      if (claimRequest[2] === "RESTORE") return DTT.freeBugMails.get(+claimRequest[1]).restore(interaction);
    }

    const weekBugMail = /(\d+)-(PENDING|RESOLVED)/.exec(interaction.customId);

    if (weekBugMail) {
      const FreeBugMail = DTT.freeBugMails.get(+weekBugMail[1]);

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
});

DTT.on("inviteDelete", invite => DTT.invites.find(({ code }) => code === invite.code)?.remove());

DTT.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.channel.id === DTT.kanal("bugmail-queue").id) {
    if (!(message.channel as TextChannel).permissionsFor(message.author).has("MANAGE_MESSAGES") && message.author.id !== DTT.user.id) message.delete();
  }
});

DTT.on("messageDelete", message => {
  if (message.guild.id !== DTT.guild.id) return;

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

DTT.login(token);
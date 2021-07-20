const Client = require("./Client/Client.js");

const { discord: { token } } = require("./Client/Keys.json");

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
  DTT.Maria.query("SELECT * FROM `Free BugMails`", (E, R) => R.forEach(freeBugMail => {
    const FreeBugMail = new DTT.FreeBugMail(DTT, freeBugMail);
    DTT.freeBugMails.set(FreeBugMail.No, FreeBugMail);
    FreeBugMail.timeout();
    FreeBugMail.mentionedTimeout();
  }));
}

function collectInvites() {
  DTT.Maria.query("SELECT * FROM `Invites`", (E, R) => R.forEach(invite => {
    const Invite = new DTT.Invite(DTT, invite);
    DTT.invites.set(Invite.No, Invite);
    if (!Invite.expired) Invite.expireTimeout();
  }));
}

DTT.on("guildMemberUpdate", (oldGuildmember, newGuildmember) => {
  if (oldGuildmember.guild.id !== DTT.guild.id) return;
  if (oldGuildmember.pending === true && newGuildmember.pending === false) DTT.Verification.sendVerification(newGuildmember);
});

DTT.on("interactionCreate", async interaction => {
  if (interaction.guildId !== DTT.guild.id) return;

  if (interaction.isCommand()) {
    let command = DTT.commands.get(interaction.commandName);
    if (!command) return;
    let subCommand = null;
    let subCommandGroup = null;

    try {
      subCommand = interaction.options.getSubCommand();
    } catch {}

    try {
      subCommandGroup = interaction.options.getSubCommandGroup();
    } catch {}

    if (subCommand && subCommandGroup) command = command.get(subCommandGroup).get(subCommand);
    if (subCommand && !subCommandGroup) command = command.get(subCommand);
    command.traditional(interaction);
    return;
  }

  if (interaction.isButton()) {
    const joiner = /(Tester|Alt|Deny)-(\d+)/.exec(interaction.customId);
    if (joiner) return DTT.Verification.authorise(interaction, joiner[1], joiner[2]);
    const roleAssignment = /ROLE-(\d+)/.exec(interaction.customId);

    if (roleAssignment) {
      const role = DTT.guild.roles.resolve(roleAssignment[1]);

      if (interaction.member.roles.cache.has(role.id)) {
        interaction.member.roles.remove(role).then(() => interaction.reply({
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
        interaction.member.roles.add(role).then(() => interaction.reply({
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
    const claimRequest = /(\d+)-(PRECLAIM|CLAIM|BUGMAILED)/.exec(interaction.customId);

    if (claimRequest && interaction.channelId === DTT.kanal("bugmail-queue").id) {
      if (claimRequest[2] === "PRECLAIM") return DTT.freeBugMails.get(+claimRequest[1]).preClaim(interaction);
      if (claimRequest[2] === "CLAIM") return DTT.freeBugMails.get(+claimRequest[1]).claim(interaction);
      if (claimRequest[2] === "BUGMAILED") return DTT.freeBugMails.get(+claimRequest[1]).alreadyBugMailed(interaction);
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
    if (!message.channel.permissionsFor(message.author).has("MANAGE_MESSAGES") && message.author.id !== DTT.user.id) message.delete();
  }
});

DTT.on("messageDelete", message => {
  if (message.guild.id !== DTT.guild.id) return;
  DTT.freeBugMails.find(({ messageId, state }) => messageId === message.id && state !== "RESOLVED")?.remove();
});

DTT.on("ready", () => {
  DTT.log("Selflessly slaving away.");
  Maria();
});

DTT.login(token);

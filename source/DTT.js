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
    Invite.expireTimeout();
  }));
}

DTT.on("guildMemberUpdate", (oldGuildmember, newGuildmember) => {
  if (oldGuildmember.guild.id !== DTT.guild.id) return;
  if (oldGuildmember.pending === true && newGuildmember.pending === false) DTT.Verification.sendVerification(newGuildmember);
});

DTT.on("interaction", async interaction => {
  if (interaction.guildID !== DTT.guild.id) return;
  let logText = `${interaction.user} interacted with the `;

  if (interaction.type === "APPLICATION_COMMAND") {
    DTT.commands.find(({ name }) => name === `${interaction.commandName}${interaction.options.first()?.type === "SUB_COMMAND" ? `_${interaction.options.firstKey()}` : ""}`)?.traditional(interaction, logText);
  }

  if (interaction.isButton()) {
    const joiner = /(Tester|Alt|Deny)-(\d+)/.exec(interaction.customID);
    if (joiner) return DTT.Verification.authorise(interaction, joiner[1], joiner[2]);
    const roleAssignment = /ROLE-(\d+)/.exec(interaction.customID);

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

    if (interaction.customID === "Free BugMail") return DTT.FreeBugMail.addRole(interaction, `${logText}"Opt in" button. `);
    if (interaction.customID === "No Free BugMail") return DTT.FreeBugMail.removeRole(interaction, `${logText}"Opt out" button. `);
    const claimRequest = /(\d+)-(PRECLAIM|CLAIM|BUGMAILED)/.exec(interaction.customID);

    if (claimRequest && interaction.channelID === DTT.kanal("bugmail-queue").id) {
      if (claimRequest[2] === "PRECLAIM") return DTT.freeBugMails.get(+claimRequest[1]).preClaim(interaction, `${logText}"Claim" button `);
      if (claimRequest[2] === "CLAIM") return DTT.freeBugMails.get(+claimRequest[1]).claim(interaction, `${logText}"Yes! Claim!" button `);
      if (claimRequest[2] === "BUGMAILED") return DTT.freeBugMails.get(+claimRequest[1]).alreadyBugMailed(interaction, `${logText}"Oops! It's BugMailed!" button `);
    }

    const weekBugMail = /(\d+)-(PENDING|RESOLVED)/.exec(interaction.customID);

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

DTT.on("inviteDelete", invite => {
  DTT.invites.find(({ code }) => code === invite.code)?.remove();
});

DTT.on("message", message => {
  if (message.author.bot) return;
  if (message.channel.id === DTT.kanal("bugmail-queue").id && message.author.id !== DTT.user.id) message.delete();
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

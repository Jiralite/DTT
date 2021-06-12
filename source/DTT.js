const Client = require("./Client/Client.js");

const { discord: { token } } = require("./Client/Keys.json");

const DTT = new Client({
  partials: [
    "MESSAGE"
  ],
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_MESSAGES"
  ]
});

function Maria() {
  DTT.Maria.getConnection(error => {
    if (!error) {
      collectFreeBugMails();
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

DTT.on("guildMemberUpdate", (oldGuildmember, newGuildmember) => {
  if (oldGuildmember.guild.id !== DTT.guild.id) return;

  if (oldGuildmember.pending === true && newGuildmember.pending === false) {
    DTT.kanal("verification").send({
      content: `Welcome to **${DTT.guild.name}**, ${newGuildmember}! Please review the ${DTT.kanal("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
      components: [
        [
          {
            type: "BUTTON",
            label: "Tester",
            customID: `Tester-${newGuildmember.id}`,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Alt Account",
            customID: `Alt-${newGuildmember.id}`,
            style: "SECONDARY"
          },
          {
            type: "BUTTON",
            label: "Deny",
            customID: `Deny-${newGuildmember.id}`,
            style: "DANGER"
          }
        ]
      ]
    });
  }
});

DTT.on("interaction", async interaction => {
  if (interaction.guildID !== DTT.guild.id) return;
  let logText = `${interaction.user} interacted with the `;

  if (interaction.type === "APPLICATION_COMMAND") {
    DTT.commands.find(({ name }) => name === `${interaction.commandName}${interaction.options.first()?.type === "SUB_COMMAND" ? `_${interaction.options.firstKey()}` : ""}`)?.traditional(interaction, logText);
  }

  if (interaction.isButton()) {
    const joiner = /(Tester|Alt|Deny)-(\d+)/.exec(interaction.customID);
    const roleAssignment = /ROLE-(\d+)/.exec(interaction.customID);

    if (joiner) {
        if (!interaction.member.roles.cache.some(({ id }) => [
          DTT.role("Admin").id,
          DTT.role("Moderator").id,
          DTT.role("DT Staff").id,
          DTT.role("DT Mod or BA").id
        ].includes(id))) {
          return interaction.reply({
            content: `You do not have permission to perform this interaction.`,
            ephemeral: true
          });
        }

        const guildmember = await DTT.guild.members.fetch(joiner[2]).catch(error => null);

        if (!guildmember) return interaction.reply({
          content: `Error fetching guildmember.`,
          ephemeral: true
        });

        if (joiner[1] === "Tester") {
          guildmember.roles.add(DTT.role("Tester")).then(() => {
            interaction.reply({
              content: `You have given the ${DTT.role("Tester")} role to ${guildmember}.`,
              ephemeral: true
            });

            interaction.message.edit({
              content: `Welcome to **${DTT.guild.name}**, ${guildmember}! Please review the ${DTT.kanal("verification")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
              components: [
                [
                  {
                    type: "BUTTON",
                    label: "Tester",
                    customID: `Tester-${guildmember.id}`,
                    style: "PRIMARY",
                    disabled: true
                  },
                  {
                    type: "BUTTON",
                    label: "Alt Account",
                    customID: `Alt-${guildmember.id}`,
                    style: "SECONDARY",
                    disabled: true
                  },
                  {
                    type: "BUTTON",
                    label: "Deny",
                    customID: `Deny-${guildmember.id}`,
                    style: "DANGER",
                    disabled: true
                  }
                ]
              ]
            }).then(() => setTimeout(() => interaction.message.delete().catch(error => null), 5000));

            DTT.kanal("general").send(`Welcome to **${DTT.guild.name}**, ${guildmember}! Be sure to check out ${DTT.kanal("roles")} and other channels!`);
          }).catch(error => {
            interaction.reply({
              content: `Error adding role to guildmember.`,
              ephemeral: true
            });
          });
        }

        if (joiner[1] === "Alt") {
          guildmember.roles.add(DTT.role("Alt Account")).then(() => {
            interaction.reply({
              content: `You have given the ${DTT.role("Alt Account")} role to ${guildmember}.`,
              ephemeral: true
            });

            interaction.message.edit({
              content: `Welcome to **${DTT.guild.name}**, ${guildmember}! Please review the ${DTT.kanal("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
              components: [
                [
                  {
                    type: "BUTTON",
                    label: "Tester",
                    customID: `Tester-${guildmember.id}`,
                    style: "PRIMARY",
                    disabled: true
                  },
                  {
                    type: "BUTTON",
                    label: "Alt Account",
                    customID: `Alt-${guildmember.id}`,
                    style: "SECONDARY",
                    disabled: true
                  },
                  {
                    type: "BUTTON",
                    label: "Deny",
                    customID: `Deny-${guildmember.id}`,
                    style: "DANGER",
                    disabled: true
                  }
                ]
              ]
            }).then(() => setTimeout(() => interaction.message.delete().catch(error => null), 5000));
          }).catch(error => {
            interaction.reply({
              content: `Error adding role to guildmember.`,
              ephemeral: true
            });
          });
        }

        if (joiner[1] === "Deny") {
          guildmember.kick().then(() => {
            interaction.reply({
              content: `${interaction.user} has kicked ${guildmember}.`
            });

            interaction.message.edit({
              content: `Welcome to **${DTT.guild.name}**, ${guildmember}! Please review the ${DTT.kanal("read-me")} channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to ${DTT.user}!`,
              components: [
                [
                  {
                    type: "BUTTON",
                    label: "Tester",
                    customID: `Tester-${guildmember.id}`,
                    style: "PRIMARY",
                    disabled: true
                  },
                  {
                    type: "BUTTON",
                    label: "Alt Account",
                    customID: `Alt-${guildmember.id}`,
                    style: "SECONDARY",
                    disabled: true
                  },
                  {
                    type: "BUTTON",
                    label: "Deny",
                    customID: `Deny-${guildmember.id}`,
                    style: "DANGER",
                    disabled: true
                  }
                ]
              ]
            }).then(() => setTimeout(() => {
              interaction.deleteReply().catch(error => null);
              interaction.message.delete().catch(error => null);
            }, 60000));
          }).catch(error => {
            interaction.reply({
              content: `Error kicking guildmember.`,
              ephemeral: true
            });
          });
        }
      }

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

DTT.on("message", message => {
  if (message.author.bot) return;
  if (message.channel.id === DTT.kanal("bugmail-queue").id && message.author.id !== DTT.user.id) message.delete();
});

DTT.on("messageDelete", message => {
  if (message.guild.id !== DTT.guild.id) return;
  DTT.freeBugMails.find(({ messageId }) => messageId === message.id)?.remove();
});

DTT.on("ready", () => {
  DTT.log("Selflessly slaving away.");
  Maria();
});

DTT.login(token);

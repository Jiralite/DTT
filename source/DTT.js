const Client = require("./Client/Client.js");

const { discord: { token } } = require("./Client/Keys.json");

const DTT = new Client({
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
    DTT.guild.channels.resolve("765621889682374656").send({
      content: `Welcome to **${DTT.guild.name}**, ${newGuildmember}! Please review the <#765620328511963176> channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
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

  if (interaction.type === "APPLICATION_COMMAND") {
    DTT.commands.find(({ name }) => name === `${interaction.commandName}${interaction.options.first()?.type === "SUB_COMMAND" ? `_${interaction.options.firstKey()}` : ""}`)?.traditional(interaction);
  }

  if (interaction.isButton()) {
    const joiner = /(Tester|Alt|Deny)-(\d+)/.exec(interaction.customID);

    if (joiner) {
        if (!interaction.member.roles.cache.some(({ id }) => [
          "765611993532334120",
          "815329929838198824",
          "776828300450201600",
          "832393264975970306",
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
          guildmember.roles.add("765638424618074122").then(role => {
            interaction.reply({
              content: `You have given the <@&765638424618074122> role to ${guildmember}.`,
              ephemeral: true
            });

            interaction.message.edit({
              content: `Welcome to **${DTT.guild.name}**, ${guildmember}! Please review the <#765620328511963176> channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
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

            DTT.guild.channels.resolve("765720809519316992").send(`Welcome to **${DTT.guild.name}**, ${guildmember}! Be sure to check out <#765706613155430411> and other channels!`);
          }).catch(error => {
            interaction.reply({
              content: `Error adding role to guildmember.`,
              ephemeral: true
            });
          });
        }

        if (joiner[1] === "Alt") {
          guildmember.roles.add("799502317430767647").then(role => {
            interaction.reply({
              content: `You have given the ${role} role to ${guildmember}.`,
              ephemeral: true
            });

            interaction.message.edit({
              content: `Welcome to **${DTT.guild.name}**, ${guildmember}! Please review the <#765620328511963176> channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
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
              content: `Welcome to **${DTT.guild.name}**, ${guildmember}! Please review the <#765620328511963176> channel and a member of staff will approve your request to join. If you do not have access within several hours, feel free to send a direct message to a staff member!`,
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

    if (interaction.customID === "Free BugMail") {
      if (interaction.member.roles.cache.has("852589448070692947")) {
        return interaction.reply({
          content: "You already have the <@&852589448070692947> role.",
          ephemeral: true
        });
      }

      interaction.member.roles.add("852589448070692947").then(() => interaction.reply({
        content: `The <@&852589448070692947> role has been added to you!`,
        ephemeral: true
      })).catch(error => {
        this.DTT.log("Error in self-role addition.", error);

        interaction.reply({
          content: "There was an error during self-role addition.",
          ephemeral: true
        });
      });
    }

    if (interaction.customID === "No Free BugMail") {
      if (!interaction.member.roles.cache.has("852589448070692947")) {
        return interaction.reply({
          content: "You do not already have the <@&852589448070692947> role.",
          ephemeral: true
        });
      }

      interaction.member.roles.remove("852589448070692947").then(() => interaction.reply({
        content: `The <@&852589448070692947> role has been removed from you!`,
        ephemeral: true
      })).catch(error => {
        this.DTT.log("Error in self-role removal.", error);

        interaction.reply({
          content: "There was an error during self-role removal.",
          ephemeral: true
        });
      });
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
  if (message.channel.id === "852581876030898176" && message.author.id !== DTT.user.id) message.delete();
});

DTT.on("ready", () => {
  DTT.log("Selflessly slaving away.");
  Maria();
});

DTT.login(token);

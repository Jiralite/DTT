const Client = require("./Client/Client.js");

const { discord: { token } } = require("./Client/Keys.json");

const DTT = new Client({
  intents: [
    "GUILDS",
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
  }));
}

DTT.on("interaction", interaction => {
  if (interaction.guildID !== DTT.guild.id) return;

  if (interaction.type === "APPLICATION_COMMAND") {
    DTT.commands.find(({ name }) => name === `${interaction.commandName}${interaction.options.first()?.type === "SUB_COMMAND" ? `_${interaction.options.firstKey()}` : ""}`)?.traditional(interaction);
  }

  if (interaction.isButton()) {
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

    const weekBugMail = /(\d+)-(PENDING|RESOLVED)/.exec(interaction);

    if (weekBugMail) {
      const FreeBugMail = DTT.freeBugMails.get(weekBugMail[1]);
      if (weekBugMail[2] === "PENDING") return FreeBugMail.resumePendingTimeout(interaction);
      if (weekBugMail[2] === "RESOLVED") return FreeBugMail.resolvePendingTimeout(interaction);
    }
  }
});

DTT.on("ready", () => {
  DTT.log("Selflessly slaving away.");
  Maria();

  DTT.guild.commands.set([
    {
      name: "role",
      description: "Used for role commands.",
      options: [
        {
          type: "SUB_COMMAND",
          name: "add",
          description: "Adds a role.",
          options: [
            {
              type: "ROLE",
              name: "role",
              description: "Select a role!",
              required: true
            }
          ]
        },
        {
          type: "SUB_COMMAND",
          name: "remove",
          description: "Removes a role.",
          options: [
            {
              type: "ROLE",
              name: "role",
              description: "Select a role!",
              required: true
            }
          ]
        }
      ]
    },
    {
      name: "submit",
      description: "Used for submitting free BugMail requests.",
      options: [
        {
          type: "STRING",
          name: "text",
          description: "Submits a Free BugMail request.",
          required: true
        }
      ]
    },
    {
      name: "claim",
      description: "Used for claiming free BugMail requests.",
      options: [
        {
          type: "STRING",
          name: "message_id",
          description: "Claims a Free BugMail request.",
          required: true
        }
      ]
    },
    {
      name: "complete",
      description: "Used for completing free BugMail requests.",
      options: [
        {
          type: "STRING",
          name: "message_id",
          description: "Completes a Free BugMail request.",
          required: true
        }
      ]
    }
  ]).then(commands => commands.forEach(command => command.setPermissions([
    {
      id: DTT.guild.roles.everyone.id,
      type: "ROLE",
      permission: false
    },
    {
      id: "765638424618074122",
      type: "ROLE",
      permission: true
    }
  ])));
});

DTT.login(token);

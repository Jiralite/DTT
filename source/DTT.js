const Client = require("./Client/Client.js");

const { discord: { token } } = require("./Client/Keys.json");

const DTT = new Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES"
  ]
});

DTT.on("interaction", interaction => {
  if (interaction.guildID !== DTT.guild.id) return;

  if (interaction.type === "APPLICATION_COMMAND") {
    DTT.commands.find(({ name }) => name === `${interaction.commandName}${interaction.options.first()?.type === "SUB_COMMAND" ? `_${interaction.options.firstKey()}` : ""}`)?.traditional(interaction);
  }
});

DTT.on("ready", () => {
  DTT.log("Selflessly slaving away.");

  DTT.guild.commands.create({
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
  }).then(command => command.setPermissions([
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
  ])).then(console.log);
});

DTT.login(token);

const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { createPool } = require("mysql");

const { discord: { prefix }, mysql } = require("./Keys.json");

const FreeBugMail = require("./FreeBugMail.js");
const Maria = createPool(mysql);

class DTT extends Client {
  constructor(options = {}) {
    super(options);
    this.prefix = prefix;
    this.Maria = Maria;
    this.commands = (() => {
      const commandsCollection = new Collection();

      for (const file of readdirSync("./Commands").filter(file => file.endsWith(".js"))) {
        const command = new (require(`../Commands/${file}`))(this);
        command.type = null;
        commandsCollection.set(command.name, command);
      }

      const folders = readdirSync("./Commands", {
        withFileTypes: true
      }).filter(file => file.isDirectory()).map(({ name }) => name);

      folders.forEach(folder => {
        for (const F of readdirSync(`./Commands/${folder}`).filter(file => file.endsWith(".js"))) {
          const command = new (require(`../Commands/${folder}/${F}`))(this);
          command.type = folder;
          commandsCollection.set(command.name, command);
        }
      });

      return commandsCollection;
    })();
    this.FreeBugMail = FreeBugMail;
    this.freeBugMails = new Collection();
  }

  log(message, consoleLog = message) {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;

    this.logChannel.send(`${stamp} ${message}`, {
      allowedMentions: {
        parse: []
      }
    }).catch(error => this.logChannel.send(`${stamp} Couldn't send a response.`));
  }

  consoleLog(consoleLog, stamp = new Date().toISOString()) {
    console.log(`- - - - - ${stamp} - - - - -`);
    console.log(consoleLog);
  }

  applyCommands() {
    this.guild.commands.set([
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
  }

  get guild() {
    return this.guilds.resolve("765611756441436160");
  }

  get logChannel() {
    return this.guild.channels.resolve("765616393969729597");
  }
}

module.exports = DTT;

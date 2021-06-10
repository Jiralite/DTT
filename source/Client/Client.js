const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");

const { discord: { prefix } } = require("./Keys.json");

class DTT extends Client {
  constructor(options = {}) {
    super(options);
    this.prefix = prefix;
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

  get guild() {
    return this.guilds.resolve("765611756441436160");
  }

  get logChannel() {
    return this.guild.channels.resolve("765616393969729597");
  }
}

module.exports = DTT;

const { readdirSync } = require("fs");

const options = [];
for (const file of readdirSync(__dirname).filter(file => file !== "index.js")) options.push(require(`${__dirname}/${file}`).commandData);

module.exports = Soulobby => ({
  applicationCommandData: {
    name: "free-bugmail",
    description: "The command for the Free BugMail queue!",
    options,
    defaultPermission: false
  },
  permissions: [
    {
      id: this.#DTT.role("Tester").id,
      type: "ROLE",
      permission: true
    }
  ]
});

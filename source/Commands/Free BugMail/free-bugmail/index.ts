import { CommandStructure } from "discord.js";
import { readdirSync } from "fs";
import DTT from "../../../Client/Client";

const options = [];
for (const file of readdirSync(__dirname).filter(file => file !== "index.js")) options.push(require(`${__dirname}/${file}`).commandData);

module.exports = (DTT: DTT): CommandStructure => ({
  applicationCommandData: {
    name: "free-bugmail",
    description: "The command for the Free BugMail queue!",
    options,
    defaultPermission: false
  },
  permissions: [
    {
      id: DTT.role("Tester").id,
      type: "ROLE",
      permission: true
    }
  ]
});

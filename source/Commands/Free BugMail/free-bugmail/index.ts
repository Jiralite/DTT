import { ApplicationCommandOptionData, CommandStructure } from "discord.js";
import DTT from "../../../Client/Client";
import complete from "./complete.js";
import edit from "./edit.js";
import submit from "./submit.js";

const options: ApplicationCommandOptionData[] = [];
options.push(complete.commandData);
options.push(edit.commandData);
options.push(submit.commandData);

export default (DTT: DTT): CommandStructure => ({
  applicationCommandData: {
    name: "free-bugmail",
    description: "The command for the Free BugMail queue!",
    options,
    defaultPermission: false
  },
  permissions: [
    {
      id: DTT.role("Tester")!.id,
      type: "ROLE",
      permission: true
    }
  ]
});

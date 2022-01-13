import { CommandInteraction, Constants } from "discord.js";

import DTT from "../../Client/Client.js";
import { Command, CommandStructure } from "../index.js";

export default class implements Command {
  readonly name = "remember";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction<"cached">): Promise<void> {
    return await this.execute(interaction);
  }

  async execute(interaction: CommandInteraction<"cached">): Promise<void> {
    const moment = interaction.options.getString("moment", true);

    if (moment === "Opinion") {
      return await interaction.reply({
        files: [new URL("../../../Resources/Opinion.png", import.meta.url).pathname]
      });
    } else throw new ReferenceError("Unknown choice");
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: this.name,
        description: "Remembers a moment.",
        type: this.type,
        options: [
          {
            type: Constants.ApplicationCommandOptionTypes.STRING,
            name: "moment",
            description: "The moment to remember.",
            required: true,
            choices: [
              {
                name: "not a bug its ur opinion",
                value: "Opinion"
              }
            ]
          }
        ],
        defaultPermission: false
      },
      permissions: [
        {
          id: DTT.role("Admin").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("DT Staff").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("Moderator").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("Discord Employee").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        },
        {
          id: DTT.role("Tester").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        }
      ]
    };
  }
}

import { CommandInteraction, CommandStructure, Constants, RememberCommand } from "discord.js";
import DTT from "../../Client/Client.js";

export default class implements RememberCommand {
  readonly name = "remember";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction): Promise<void> {
    return await this.execute(interaction);
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const moment = interaction.options.getString("moment", true);

    if (moment === "Opinion") {
      const Opinion = DTT.images[moment];
      if (!Opinion) throw new ReferenceError("Unknown heading");

      return await interaction.reply({
        files: [
          Opinion
        ]
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
          id: DTT.role("Tester").id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

import { CommandInteraction, CommandStructure, Constants, InviteCommand } from "discord.js";
import DTT from "../../Client/Client.js";

export default class implements InviteCommand {
  readonly name = "invite";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction): Promise<void> {
    return await this.execute(interaction);
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const verification = DTT.channel("verification");

    if (!verification.permissionsFor(await DTT.guild.members.fetch(DTT.user.id)).has("CREATE_INSTANT_INVITE")) {
      DTT.log(`${interaction.user} attempted to create an invite but I lacked invite permissions for ${verification}.`);

      return await interaction.reply({
        content: "Apparently, I do not have invite permissions.",
        ephemeral: true
      });
    }

    const Invites = DTT.invites.filter(({ id, expired }) => id === interaction.user.id && !expired);

    if (Invites.size > 0) {
      return await interaction.reply({
        content: `You possess non-expired invites already:\n${Invites.map(Invite => `• \`${Invite.code}\``).join("\n")}`,
        ephemeral: true
      });
    }

    const Invite = new DTT.Invite({
      No: null,
      ID: interaction.user.id,
      "Created Timestamp": null,
      "Expired Timestamp": null,
      Expired: null,
      Code: null
    });

    return await Invite.create(interaction);
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: this.name,
        description: "Generates a one-time invite.",
        type: this.type,
        defaultPermission: false
      },
      permissions: [
        {
          id: DTT.role("Tester").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        }
      ]
    };
  }
}

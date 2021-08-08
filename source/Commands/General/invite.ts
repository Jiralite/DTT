import { CommandInteraction, CommandStructure } from "discord.js";
import DTT from "../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name: string;

  constructor(DTT: DTT) {
    this.DTT = DTT;
    this.name = "invite";
  }

  async traditional(interaction: CommandInteraction) {
    if (!this.DTT.kanal("verification").permissionsFor(this.DTT.user).has("CREATE_INSTANT_INVITE")) {
      interaction.reply({
        content: "Apparently, I do not have invite permissions.",
        ephemeral: true
      });

      this.DTT.log(`${interaction.user} attempted to create an invite but I lacked invite permissions for ${this.DTT.kanal("verification")}.`);
      return;
    }

    const Invites = this.DTT.invites.filter(({ id, expired }) => id === interaction.user.id && !expired);

    if (Invites.size > 0) {
      return interaction.reply({
        content: `You possess non-expired invites already:\n${Invites.map(Invite => `• \`${Invite.code}\``).join("\n")}`,
        ephemeral: true
      });
    }

    const Invite = new this.DTT.Invite(this.DTT, {
      ID: interaction.user.id
    });

    Invite.create(interaction);
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: "invite",
        description: "Generates a one-time invite.",
        defaultPermission: false
      },
      permissions: [
        {
          id: this.DTT.role("Tester").id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}
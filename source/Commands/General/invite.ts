import { CommandInteraction, CommandStructure, GuildMember } from "discord.js";
import DTT from "../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "invite";

  constructor(DTT: DTT) {
    this.DTT = DTT;
  }

  traditional(interaction: CommandInteraction) {
    const verification = this.DTT.kanal("verification");

    if (verification === null) {
      this.DTT.log("Apparently, the verification channel cannot be found.");

      return interaction.reply({
        content: "Error, cannot find the verification channel.",
        ephemeral: true
      });
    }

    if (!verification.permissionsFor(interaction.guild!.me as GuildMember).has("CREATE_INSTANT_INVITE")) {
      interaction.reply({
        content: "Apparently, I do not have invite permissions.",
        ephemeral: true
      });

      this.DTT.log(`${interaction.user} attempted to create an invite but I lacked invite permissions for ${verification}.`);
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
      No: null,
      ID: interaction.user.id,
      "Created Timestamp": null,
      "Expired Timestamp": null,
      Expired: null,
      Code: null
    });

    Invite.create(interaction);
  }

  get commandData(): CommandStructure {
    const tester = this.DTT.role("Tester");
    if (tester === null) throw new ReferenceError("Could not find the Tester role.");

    return {
      applicationCommandData: {
        name: "invite",
        description: "Generates a one-time invite.",
        defaultPermission: false
      },
      permissions: [
        {
          id: tester.id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

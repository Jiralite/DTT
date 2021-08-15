import { CommandInteraction, CommandStructure, GuildMember } from "discord.js";
import DTT from "../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "invite";

  constructor(DTT: DTT) {
    this.DTT = DTT;
  }

  traditional(interaction: CommandInteraction): void {
    if (interaction.guild === null) {
      this.DTT.log(`Somehow, the \`/${this.name}\` slash command was used in a non-guild environment?`, interaction);

      interaction.reply({
        content: "Where am I? Who am I? ...Who are you?\nDo you know who I am? Can you help me find my path? Is this a journey I have to tak by myself?",
        ephemeral: true
      });

      return;
    }

    const verification = this.DTT.kanal("verification");

    if (verification === null) {
      this.DTT.log("Apparently, the verification channel cannot be found.");

      interaction.reply({
        content: "Error, cannot find the verification channel.",
        ephemeral: true
      });

      return;
    }

    if (!verification.permissionsFor(interaction.guild.me as GuildMember).has("CREATE_INSTANT_INVITE")) {
      interaction.reply({
        content: "Apparently, I do not have invite permissions.",
        ephemeral: true
      });

      this.DTT.log(`${interaction.user} attempted to create an invite but I lacked invite permissions for ${verification}.`);
      return;
    }

    const Invites = this.DTT.invites.filter(({ id, expired }) => id === interaction.user.id && !expired);

    if (Invites.size > 0) {
      interaction.reply({
        content: `You possess non-expired invites already:\n${Invites.map(Invite => `• \`${Invite.code}\``).join("\n")}`,
        ephemeral: true
      });

      return;
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

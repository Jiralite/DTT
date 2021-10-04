import { CommandInteraction, CommandStructure, Constants, GuildMember, InviteCommand } from "discord.js";
import DTT from "../../Client/Client";

export default class implements InviteCommand {
  readonly name = "invite";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction): Promise<void> {
    return await Promise.resolve(this.execute(interaction));
  }

  execute(interaction: CommandInteraction): void {
    if (interaction.guild === null) {
      DTT.log(`Somehow, the \`/${this.name}\` slash command was used in a non-guild environment?`, interaction);

      interaction.reply({
        content: "Where am I? Who am I? ...Who are you?\nDo you know who I am? Can you help me find my path? Is this a journey I have to take by myself?",
        ephemeral: true
      });

      return;
    }

    const verification = DTT.channel("verification");

    if (!verification.permissionsFor(interaction.guild.me as GuildMember).has("CREATE_INSTANT_INVITE")) {
      interaction.reply({
        content: "Apparently, I do not have invite permissions.",
        ephemeral: true
      });

      DTT.log(`${interaction.user} attempted to create an invite but I lacked invite permissions for ${verification}.`);
      return;
    }

    const Invites = DTT.invites.filter(({ id, expired }) => id === interaction.user.id && !expired);

    if (Invites.size > 0) {
      interaction.reply({
        content: `You possess non-expired invites already:\n${Invites.map(Invite => `• \`${Invite.code}\``).join("\n")}`,
        ephemeral: true
      });

      return;
    }

    const Invite = new DTT.Invite({
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
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

import { CommandInteraction, CommandStructure, Constants, GuildMember, InviteCommand, Permissions } from "discord.js";
import DTT from "../../Client/Client.js";
import Invite from "../../Client/Invite.js";

export default class implements InviteCommand {
  readonly name = "invite";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  async handle(interaction: CommandInteraction): Promise<void> {
    return await this.execute(interaction);
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const permissionCheck = (await DTT.guild.members.fetch(DTT.user.id)).permissions.missing([
      Permissions.FLAGS.BAN_MEMBERS,
      Permissions.FLAGS.CREATE_INSTANT_INVITE
    ]).map(permission => `\`${permission}\``);

    if (permissionCheck.length > 0) {
      const permissionText = permissionCheck.join(" & ");
      DTT.log(`${interaction.user} attempted to create an invite but lacked permissions:\n${permissionText}`);

      return await interaction.reply({
        content: "Apparently, I do not have invite permissions.",
        ephemeral: true
      });
    }

    const invitee = interaction.options.getUser("invitee", true);
    const inviteeAsGuildMember = interaction.options.getMember("invitee");

    if (interaction.user.id === invitee.id) {
      DTT.log(`${interaction.user} attempted to create an invite for themselves.`);

      return await interaction.reply({
        content: "You cannot create an invite for yourself.",
        ephemeral: true
      });
    }

    if (inviteeAsGuildMember instanceof GuildMember) {
      DTT.log(`${interaction.user} attempted to create an invite for ${inviteeAsGuildMember} (already in server).`);

      return await interaction.reply({
        content: `The user (${inviteeAsGuildMember}) you are trying to invite is already in the server.`,
        ephemeral: true
      });
    }

    const invites = Invite.cache.filter(({ inviterId, isExpired }) => inviterId === interaction.user.id && isExpired());

    if (invites.size > 0) {
      return await interaction.reply({
        content: `You possess non-expired invites already:\n${invites.map(({ code }) => `• \`${code}\``).join("\n")}`,
        ephemeral: true
      });
    }

    // Silently pass to ensure people don't use this as a way to find out whether someone is banned.
    if ((await DTT.guild.bans.fetch({ cache: false })).has(invitee.id)) DTT.log(`${interaction.user} attempted to create an invite for ${invitee} (currently banned).`);
    return await Invite.create(interaction, invitee);
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: this.name,
        description: "Generates a one-time invite.",
        type: this.type,
        options: [
          {
            type: Constants.ApplicationCommandOptionTypes.USER,
            name: "invitee",
            description: "The intended recipient of this invite.",
            required: true
          }
        ],
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

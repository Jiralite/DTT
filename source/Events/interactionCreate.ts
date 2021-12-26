import { Constants, Formatters, Permissions, Role, Snowflake } from "discord.js";
import DTT from "../Client/Client.js";
import FreeBugMail from "../Client/FreeBugMail.js";
import Verification, { VerificationType } from "../Client/Verification.js";
import { isCommandName, RoleCategories, RolesCommand, SubRoleCategories } from "../Commands/index.js";
import { Event } from "./index.js";

const name = Constants.Events.INTERACTION_CREATE;

export const event: Event<typeof name> = {
  name,
  once: false,
  async fire(interaction): Promise<void> {
    if (!interaction.inCachedGuild() || interaction.guildId !== DTT.guild.id) return;

    if (interaction.isCommand()) {
      const commandName = interaction.commandName;

      if (!isCommandName(commandName)) {
        return interaction.reply({
          content: "your ban has been scheduled for tomorrow",
          ephemeral: true
        });
      }

      const command = DTT.commands[commandName];

      if (interaction.channelId === DTT.channel("bugmail-queue").id && command.name !== "free-bugmail" && !interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        return interaction.reply({
          content: "Disallowed slash command for this channel.",
          ephemeral: true
        });
      }

      try {
        await command.handle(interaction, interaction.options.getSubcommand(false));
      } catch (error) {
        DTT.log(`Error running command "${commandName}".`, error);
        const errorMessage = "An error was encountered. It's being tracked.";

        if (interaction.deferred || interaction.replied) {
          interaction.followUp({
            content: errorMessage,
            ephemeral: true
          });
        } else {
          interaction.reply({
            content: errorMessage,
            ephemeral: true
          });
        }
      }

      return;
    }

    if (interaction.isContextMenu()) {
      interaction.reply({
        content: "your ban has been scheduled for tomorrow",
        ephemeral: true
      });

      return;
    }

    if (interaction.isButton()) {
      const joiner = /(TESTER|ALT|DENY)-(\d+)/.exec(interaction.customId);
      if (joiner) return Verification.authorise(interaction, (joiner[1] as VerificationType), (joiner[2] as Snowflake));
      if (interaction.customId === "SELFROLE_BACK") return DTT.commands.roles.handle(interaction);
      const roleAssignment = /SELFROLE-(\d+)/.exec(interaction.customId);

      if (roleAssignment) {
        const role = DTT.guild.roles.resolve(roleAssignment[1]) as Role;

        if (interaction.member.roles.cache.has(role.id)) {
          interaction.member.roles.remove(role).then(() => interaction.reply({
            content: `The ${role} role has been removed from you!`,
            ephemeral: true
          })).catch(error => {
            DTT.log("Error in self-role removal.", error);

            interaction.reply({
              content: "There was an error during self-role removal.",
              ephemeral: true
            });
          });
        } else {
          interaction.member.roles.add(role).then(() => interaction.reply({
            content: `The ${role} role has been added to you!`,
            ephemeral: true
          })).catch(error => {
            DTT.log("Error in self-role addition.", error);

            interaction.reply({
              content: "There was an error during self-role addition.",
              ephemeral: true
            });
          });
        }
      }

      if (interaction.customId === "Free BugMail") return FreeBugMail.addRole(interaction);
      if (interaction.customId === "No Free BugMail") return FreeBugMail.removeRole(interaction);
      const freeBugMailRegExp = /(\d+)-(PENDING|PRECLAIM|RESOLVED|RESTORE)/.exec(interaction.customId);

      if (freeBugMailRegExp && (interaction.channelId === DTT.channel("bugmail-queue").id || interaction.channelId === DTT.channel("bugmail-discussion").id)) {
        if (freeBugMailRegExp[2] === "PRECLAIM") return FreeBugMail.cache.get(Number(freeBugMailRegExp[1]))?.preClaim(interaction);
        if (freeBugMailRegExp[2] === "RESTORE") return FreeBugMail.cache.get(Number(freeBugMailRegExp[1]))?.restore(interaction);

        const freeBugMail = FreeBugMail.cache.get(Number(freeBugMailRegExp[1]));
        if (!freeBugMail || !freeBugMail.isPending()) return;

        if (interaction.user.id !== freeBugMail.claimedById) {
          return interaction.reply({
            content: `We're currently awaiting the response of ${Formatters.userMention(freeBugMail.claimedById)} right now, not you!`,
            ephemeral: true
          });
        }

        if (freeBugMailRegExp[2] === "PENDING") return freeBugMail.resumePendingTimeout(interaction);
        if (freeBugMailRegExp[2] === "RESOLVED") return freeBugMail.resolvePendingTimeout(interaction);
      }
    }

    if (interaction.isSelectMenu()) {
      if (interaction.customId === "SELFROLE_CATEGORY") return (DTT.commands.roles as RolesCommand).categoryInteraction(interaction, interaction.values[0] as RoleCategories);
      if (!interaction.customId.startsWith("SELFROLE")) return;
      const roles: Role[] = interaction.values.map(id => DTT.guild.roles.resolve(id) as Role);

      if (roles.some(role => role === null)) {
        DTT.log("Error during self-role. Detected role ids that couldn't be found.");

        return interaction.reply({
          content: "Error: detected a role that couldn't be found.",
          ephemeral: true
        });
      }

      const rolesToSet = interaction.member.roles.cache.clone();
      const rolesAdded: Role[] = [];
      const rolesRemoved: Role[] = [];

      for (const role of roles) {
        if (!rolesToSet.has(role.id)) {
          rolesToSet.set(role.id, role);
          rolesAdded.push(role);
        }
      }

      for (const { role } of (DTT.commands.roles as RolesCommand).resolveSelectMenuCategoryRoles(interaction.customId.slice(9) as SubRoleCategories).filter(({ role }) => !roles.some(({ id }) => id === role.id))) {
        if (rolesToSet.has(role.id)) {
          rolesToSet.delete(role.id);
          rolesRemoved.push(role);
        }
      }

      interaction.member.roles.set(rolesToSet).then(() => {
        interaction.reply({
          content: `Roles added: ${rolesAdded.join(" & ") || "None."}\nRoles removed: ${rolesRemoved.join(" & ") || "None."}`,
          ephemeral: true
        });
      }).catch(error => {
        DTT.log("Error during applying self-roles.", error);

        interaction.reply({
          content: "There was an error applying self-roles.",
          ephemeral: true
        });
      });
    }
  }
};

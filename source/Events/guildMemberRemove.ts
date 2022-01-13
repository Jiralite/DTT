import { Constants } from "discord.js";

import DTT from "../Client/Client.js";
import { Event } from "./index.js";

const name = Constants.Events.GUILD_MEMBER_REMOVE;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(guildMember): void {
    if (guildMember.guild.id !== DTT.guild.id) return;
    DTT.inviteLog(`${guildMember.user} (${guildMember.user.tag}) has left the server.`);
  }
};

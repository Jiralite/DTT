import { Constants } from "discord.js";
import { Event } from "./index.js";
import DTT from "../Client/Client.js";
import Verification from "../Client/Verification.js";

const name = Constants.Events.GUILD_MEMBER_ADD;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(guildMember): void {
    if (guildMember.guild.id !== DTT.guild.id) return;
    Verification.sendVerification(guildMember);
  }
};

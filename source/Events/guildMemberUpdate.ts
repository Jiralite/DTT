import { Constants } from "discord.js";
import DTT from "../Client/Client.js";
import { Event } from "./index.js";

const name = Constants.Events.GUILD_MEMBER_UPDATE;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(oldGuildmember, newGuildmember): void {
    if (oldGuildmember.guild.id !== DTT.guild.id) return;
    if (oldGuildmember.pending === true && newGuildmember.pending === false) DTT.Verification.sendVerification(newGuildmember);
  }
};

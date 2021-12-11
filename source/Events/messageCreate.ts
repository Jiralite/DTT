import { Constants, Permissions } from "discord.js";
import DTT from "../Client/Client.js";
import { Event } from "./index.js";

const name = Constants.Events.MESSAGE_CREATE;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(message): void {
    if (message.author.bot || !message.inGuild()) return;
    if (message.channelId === DTT.channel("bugmail-queue").id && (message.member === null || !message.channel.permissionsFor(message.member).has(Permissions.FLAGS.MANAGE_MESSAGES))) message.delete();
    if (message.channelId === DTT.channel("reddit").id && message.type === "THREAD_CREATED") message.delete();
  }
};

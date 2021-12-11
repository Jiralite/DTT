import { Constants } from "discord.js";
import DTT from "../Client/Client.js";
import FreeBugMail from "../Client/FreeBugMail.js";
import { Event } from "./index.js";

const name = Constants.Events.MESSAGE_DELETE;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(message): void {
    if (message.guild?.id !== DTT.guild.id) return;

    for (const freeBugMail of FreeBugMail.cache.values()) {
      if (freeBugMail.messageId === message.id && !freeBugMail.isResolved()) {
        freeBugMail.remove();
        return;
      }

      if (freeBugMail.disabledMessageId === message.id) {
        freeBugMail.disabledMessageId = null;
        return;
      }
    }
  }
};

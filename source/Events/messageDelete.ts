import { Constants } from "discord.js";
import DTT from "../Client/Client.js";
import { Event } from "./index.js";

const name = Constants.Events.MESSAGE_DELETE;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(message): void {
    if (message.guild?.id !== DTT.guild.id) return;

    for (const FreeBugMail of DTT.freeBugMails.values()) {
      if (FreeBugMail.messageId === message.id && FreeBugMail.state !== "RESOLVED") {
        FreeBugMail.remove();
        return;
      }

      if (FreeBugMail.disabledMessageId === message.id) {
        FreeBugMail.disabledMessageId = null;
        return;
      }
    }
  }
};

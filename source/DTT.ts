import { readdirSync } from "node:fs";
import { Constants } from "discord.js";

import DTT from "./Client/Client.js";

const eventsPath = new URL("./Events/", import.meta.url);

for (const file of readdirSync(eventsPath).filter(file => file !== "index.js")) {
  const { name, once, fire } = (await import(eventsPath + file)).event;
  DTT[once ? "once" : "on"](name, fire);
}

DTT.on(Constants.Events.MESSAGE_DELETE, message => {
  if (message.guild?.id !== DTT.guild.id) return;

  for (const FreeBugMail of DTT.freeBugMails.values()) {
    if (FreeBugMail.messageId === message.id && FreeBugMail.state !== "RESOLVED") return FreeBugMail.remove();

    if (FreeBugMail.disabledMessageId === message.id) {
      FreeBugMail.disabledMessageId = null;
      return;
    }
  }
});

DTT.login();

import { readdirSync } from "node:fs";
import { URL } from "node:url";
import DTT from "./Client/Client.js";
import 'dotenv/config'

const eventsPath = new URL("Events/", import.meta.url);

for (const file of readdirSync(eventsPath).filter(file => file !== "index.js")) {
  const {
    event: { name, once, fire }
  } = await import(new URL(file, eventsPath).toString());
  DTT[once ? "once" : "on"](name, fire);
}

DTT.login();

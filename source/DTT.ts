import { readdirSync } from "node:fs";
import DTT from "./Client/Client.js";

const eventsPath = new URL("./Events/", import.meta.url);

for (const file of readdirSync(eventsPath).filter(file => file !== "index.js")) {
  const { name, once, fire } = (await import(new URL(file, eventsPath).toString())).event;
  DTT[once ? "once" : "on"](name, fire);
}

DTT.login();

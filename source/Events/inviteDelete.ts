import { Constants } from "discord.js";
import { Event } from "./index.js";
import Invite from "../Client/Invite.js";

const name = Constants.Events.INVITE_DELETE;

export const event: Event<typeof name> = {
  name,
  once: false,
  fire(invite): void {
    Invite.cache.find(({ code }) => code === invite.code)?.remove();
  }
};

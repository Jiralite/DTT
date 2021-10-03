import { CommandInteraction, InviteData, Snowflake, TextChannel } from "discord.js";
import { OkPacket } from "mysql";
import DTT from "./Client.js";

export default class Invite {
  No: number | null;
  id: Snowflake;
  createdTimestamp: number | null;
  expiredTimestamp: number | null;
  expired: boolean;
  code: string | null;
  timeout: NodeJS.Timeout | null;

  constructor(invite: InviteData) {
    this.No = invite.No;
    this.id = invite.ID;
    this.createdTimestamp = invite["Created Timestamp"] === null ? null : +invite["Created Timestamp"];
    this.expiredTimestamp = invite["Expired Timestamp"] === null ? null : +invite["Expired Timestamp"];
    this.expired = Boolean(invite.Expired);
    this.code = invite.Code;
    this.timeout = null;
  }

  create(interaction: CommandInteraction): void {
    this.verification.createInvite({
      maxAge: 86400, // 1 day
      maxUses: 1,
      unique: true
    }).then(invite => {
      DTT.Maria.query("INSERT INTO `Invites` SET ?;", {
        ID: interaction.user.id,
        "Created Timestamp": invite.createdTimestamp,
        "Expired Timestamp": invite.expiresTimestamp,
        Expired: false,
        Code: invite.code
      }, (E, { insertId }: OkPacket) => {
        if (E) {
          DTT.log("Error during Invite#create().", E);

          interaction.reply({
            content: "There was an error creating the invite.",
            ephemeral: true
          });

          return;
        }

        this.No = insertId;
        this.createdTimestamp = invite.createdTimestamp;
        this.expiredTimestamp = invite.expiresTimestamp;
        this.expired = false;
        this.code = invite.code;
        DTT.invites.set(this.No, this);
        this.expireTimeout();

        interaction.reply({
          content: `Your invite code: \`${this.code}\``,
          ephemeral: true
        });

        this.inviteLogs.send({
          content: `${interaction.user} generated a one-time invite code: \`${this.code}\``,
          allowedMentions: {
            parse: []
          }
        });
      });
    }).catch(error => {
      DTT.log("Error creating invite.", error);

      interaction.reply({
        content: "There was an error creating the invite.",
        ephemeral: true
      });
    });
  }

  expireTimeout(): void {
    if (!this.expired && this.expiredTimestamp !== null) this.timeout = setTimeout(() => this.remove(), this.expiredTimestamp - Date.now());
  }

  remove(): void {
    DTT.Maria.query("UPDATE `Invites` SET `Expired` = ? WHERE `No` = ?;", [
      true,
      this.No
    ], E => {
      if (E) return DTT.log("Error during Invite#remove().", E);
      this.expired = true;
      if (this.timeout !== null) clearTimeout(this.timeout);

      this.inviteLogs.send({
        content: `Invite code \`${this.code}\` has just expired. <@${this.id}> generated this invite code.`,
        allowedMentions: {
          parse: []
        }
      });
    });
  }

  get verification(): TextChannel {
    return DTT.kanal("verification") as TextChannel;
  }

  get inviteLogs(): TextChannel {
    return DTT.kanal("invite-logs") as TextChannel;
  }
}

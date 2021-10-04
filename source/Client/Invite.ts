import { CommandInteraction, InviteData, Snowflake, TextChannel } from "discord.js";
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

  async create(interaction: CommandInteraction): Promise<void> {
    const invite = await this.verification.createInvite({
      maxAge: 86400, // 1 day
      maxUses: 1,
      unique: true
    });

    const { insertId } = await DTT.Maria.query("INSERT INTO `Invites` SET `ID` = ?, `Created Timestamp` = ?, `Expired Timestamp` = ?, `Expired` = ?, `Code` = ?;", [
      interaction.user.id,
      invite.createdTimestamp,
      invite.expiresTimestamp,
      false,
      invite.code
    ]);

    this.No = insertId;
    this.createdTimestamp = invite.createdTimestamp;
    this.expiredTimestamp = invite.expiresTimestamp;
    this.expired = false;
    this.code = invite.code;
    DTT.invites.set(insertId, this);
    this.expireTimeout();

    await interaction.reply({
      content: `Your invite code: \`${this.code}\``,
      ephemeral: true
    });

    await this.inviteLogs.send({
      content: `${interaction.user} generated a one-time invite code: \`${this.code}\``,
      allowedMentions: {
        parse: []
      }
    });
  }

  expireTimeout(): void {
    if (!this.expired && this.expiredTimestamp !== null) this.timeout = setTimeout(() => this.remove(), this.expiredTimestamp - Date.now());
  }

  async remove(): Promise<void> {
    await DTT.Maria.query("UPDATE `Invites` SET `Expired` = ? WHERE `No` = ?;", [
      true,
      this.No
    ]);

    this.expired = true;
    if (this.timeout !== null) clearTimeout(this.timeout);

    await this.inviteLogs.send({
      content: `Invite code \`${this.code}\` has just expired. <@${this.id}> generated this invite code.`,
      allowedMentions: {
        parse: []
      }
    });
  }

  get verification(): TextChannel {
    return DTT.channel("verification") as TextChannel;
  }

  get inviteLogs(): TextChannel {
    return DTT.channel("invite-logs") as TextChannel;
  }
}

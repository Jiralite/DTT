import { Collection, CommandInteraction, Formatters, Snowflake, TextChannel, User } from "discord.js";
import DTT, { Maria } from "./Client.js";

interface InviteData {
  No: number;
  "Inviter ID": Snowflake;
  "Invitee ID": Snowflake;
  "Created Timestamp": number;
  "Expires Timestamp": number;
  Expired: boolean;
  Code: string;
}

export default class Invite {
  static readonly cache = new Collection<number, Invite>();
  readonly No: number;
  readonly inviterId: Snowflake;
  readonly inviteeId: Snowflake;
  readonly createdTimestamp: number;
  readonly expiresTimestamp: number;
  expired: boolean;
  readonly code: string;
  timeout: NodeJS.Timeout | null = null;

  constructor(invite: InviteData) {
    this.No = invite.No;
    this.inviterId = invite["Inviter ID"];
    this.inviteeId = invite["Invitee ID"];
    this.createdTimestamp = invite["Created Timestamp"];
    this.expiresTimestamp = invite["Expires Timestamp"];
    this.expired = Boolean(invite.Expired);
    this.code = invite.Code;
  }

  static async create(interaction: CommandInteraction<"cached">, invitee: User): Promise<void> {
    const verification = DTT.channel("verification") as TextChannel;

    const invite = await verification.createInvite({
      maxAge: 86400, // 1 day
      maxUses: 1,
      unique: true,
      reason: `Created with the intent to invite ${invitee.id}.`
    });

    const { insertId } = await Maria.query("INSERT INTO `Invites` SET `Inviter ID` = ?, `Invitee ID` = ?, `Created Timestamp` = ?, `Expires Timestamp` = ?, `Expired` = ?, `Code` = ?;", [
      interaction.user.id,
      invitee.id,
      invite.createdTimestamp,
      invite.expiresTimestamp,
      false,
      invite.code
    ]);

    const newInvite = new Invite({
      No: insertId,
      "Inviter ID": interaction.user.id,
      "Invitee ID": invitee.id,
      // The next two properties cannot be null right after creating an invite.
      "Created Timestamp": invite.createdTimestamp!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      "Expires Timestamp": invite.expiresTimestamp!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      Expired: false,
      Code: invite.code
    });

    Invite.cache.set(newInvite.No, newInvite);

    await newInvite.inviteLogs.send({
      content: `${interaction.user} generated a one-time invite code (\`${newInvite.code}\`) with the intent to invite ${invitee}.`,
      allowedMentions: {
        parse: []
      }
    });

    await interaction.reply({
      content: `Your invite code with the intent to invite ${invitee}: \`${newInvite.code}\``,
      ephemeral: true
    });

    newInvite.expireTimeout();
  }

  expireTimeout(): void {
    this.timeout = setTimeout(() => this.remove(), this.expiresTimestamp - Date.now());
  }

  async remove(): Promise<void> {
    await Maria.query("UPDATE `Invites` SET `Expired` = ? WHERE `No` = ?;", [
      true,
      this.No
    ]);

    this.expired = true;

    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    await this.inviteLogs.send({
      content: `Invite code \`${this.code}\` has just expired.\n${Formatters.userMention(this.inviterId)} generated this invite code with the intent to invite ${Formatters.userMention(this.inviteeId)}.`,
      allowedMentions: {
        parse: []
      }
    });
  }

  isExpired(): this is this & { expired: true } {
    return this.expired;
  }

  get verification(): TextChannel {
    return DTT.channel("verification") as TextChannel;
  }

  get inviteLogs(): TextChannel {
    return DTT.channel("invite-logs") as TextChannel;
  }
}

class Invite {
  #DTT;

  constructor(DTT, invite) {
    this.#DTT = DTT;
    this.No = invite.No;
    this.id = invite.ID;
    this.createdTimestamp = +invite["Created Timestamp"] || null;
    this.expiredTimestamp = +invite["Expired Timestamp"] || null;
    this.expired = !!invite.Expired;
    this.code = invite.Code;
  }

  create(interaction) {
    this.#DTT.kanal("verification").createInvite({
      maxAge: 86400, // 1 day
      maxUses: 1,
      unique: true
    }).then(invite => {
      this.#DTT.Maria.query("INSERT INTO `Invites` SET ?;", {
        ID: interaction.user.id,
        "Created Timestamp": invite.createdTimestamp,
        "Expired Timestamp": invite.expiresTimestamp,
        Expired: false,
        Code: invite.code
      }, (E, { insertId }) => {
        if (E) {
          this.#DTT.log("Error during Invite#create().", E);

          interaction.reply({
            content: "There was an error creating the invite.",
            ephemeral: true
          });

          return;
        }

        this.No = insertId;
        this.createdTimestamp = invite.createdTimestamp;
        this.expiredTimestamp = invite.expiresTimestamp;
        this.code = invite.code;
        this.#DTT.invites.set(this.No, this);
        this.expireTimeout();

        interaction.reply({
          content: `Your invite code: \`${this.code}\``,
          ephemeral: true
        });

        this.inviteLogs.send({
          content: `${interaction.user} generated a one-time invite code: ${this.code}`,
          allowedMentions: {
            parse: []
          }
        });
      });
    }).catch(error => {
      this.#DTT.log("Error creating invite.", error);

      interaction.reply({
        content: "There was an error creating the invite.",
        ephemeral: true
      });
    });
  }

  expireTimeout() {
    setTimeout(() => this.remove(), this.expiredTimestamp - Date.now());
  }

  remove() {
    this.#DTT.Maria.query("UPDATE `Invites` SET `Expired` = ? WHERE `No` = ?;", [
      true,
      this.No
    ], E => {
      if (E) return this.#DTT.log("Error during Invite#remove().", E);
      this.expired = true;

      this.inviteLogs.send({
        content: `Invite code \`${this.code}\` has just expired. <@${this.id}> generated this invite code.`,
        allowedMentions: {
          parse: []
        }
      });
    });
  }

  get inviteLogs() {
    return this.#DTT.kanal("invite-logs");
  }
}

module.exports = Invite;

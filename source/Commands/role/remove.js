class role_remove {
  #DTT;

  constructor(DTT) {
    this.name = "role_remove";
    this.#DTT = DTT;
  }

  traditional(interaction) {
    const role = interaction.options.first().options.first().role;
    if (!interaction.member.roles.cache.has(role.id)) return interaction.reply({
      content: `You do not already have the ${role} role.`,
      ephemeral: true
    });

    if (this.allowedRoles.includes(role.id)) {
      interaction.member.roles.remove(role).then(() => interaction.reply({
        content: `The ${role} role has been removed from you!`,
        ephemeral: true
      })).catch(error => {
        this.#DTT.log("Error in self-role removal.", error);

        interaction.reply({
          content: "There was an error during self-role removal.",
          ephemeral: true
        });
      });
    } else {
      interaction.reply({
        content: `The ${role} role is not a self-assignable role.`,
        ephemeral: true
      });
    }
  }

  get allowedRoles() {
    return [
      this.#DTT.role("Android"),
      this.#DTT.role("Desktop"),
      this.#DTT.role("iOS"),
      this.#DTT.role("DBug"),
      this.#DTT.role("Boardless"),
      this.#DTT.role("Status Updates"),
      this.#DTT.role("Canary Updates"),
      this.#DTT.role("PTB Updates"),
      this.#DTT.role("Stable Updates"),
      this.#DTT.role("Mac"),
      this.#DTT.role("macOS El Capitan"),
      this.#DTT.role("macOS Sierra"),
      this.#DTT.role("macOS High Sierra"),
      this.#DTT.role("macOS Mojave"),
      this.#DTT.role("macOS Catalina"),
      this.#DTT.role("macOS Big Sur"),
      this.#DTT.role("macOS Monterey"),
      this.#DTT.role("Linux"),
      this.#DTT.role("Windows"),
      this.#DTT.role("Windows 7"),
      this.#DTT.role("Windows 8"),
      this.#DTT.role("Windows 10"),
      this.#DTT.role("iPhone"),
      this.#DTT.role("iPod"),
      this.#DTT.role("iPad"),
      this.#DTT.role("iOS 10"),
      this.#DTT.role("iOS 11"),
      this.#DTT.role("iOS 12"),
      this.#DTT.role("iOS 13"),
      this.#DTT.role("iOS 14"),
      this.#DTT.role("iOS 15"),
      this.#DTT.role("Android"),
      this.#DTT.role("Android 5"),
      this.#DTT.role("Android 6"),
      this.#DTT.role("Android 7"),
      this.#DTT.role("Android 8"),
      this.#DTT.role("Android 9"),
      this.#DTT.role("Android 10"),
      this.#DTT.role("Android 11"),
      this.#DTT.role("Android 12"),
      this.#DTT.role("Chromebook"),
      this.#DTT.role("Mobile Hardware Keyboard"),
      this.#DTT.role("Apple Pencil"),
      this.#DTT.role("Apple Watch"),
      this.#DTT.role("Touchscreen PC"),
      this.#DTT.role("Stickers"),
      this.#DTT.role("GDPR")
    ];
  }
}

module.exports = role_remove;

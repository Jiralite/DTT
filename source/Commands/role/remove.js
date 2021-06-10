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
      "765617891415556106",
      "765617904665362472",
      "765617920134742067",
      "803250701168934913",
      "803327819001364500",
      "819294185206972416",
      "765633934813823008",
      "765633896544206848",
      "765619042403745844",
      "766338739995672616",
      "852473203623591936",
      "852473381974048819",
      "852473425179049985",
      "852473455957114910",
      "852473484956401694",
      "852473513552904202",
      "852473541956861952",
      "766339902396301322",
      "766339705662734386",
      "852472935163625493",
      "852472977105747980",
      "852473007753527346",
      "766338561405485106",
      "766338590337794080",
      "766338608624828426",
      "852472437509455904",
      "852472612344823838",
      "852472632921292820",
      "852472643386343434",
      "852472652333711370",
      "852472663288578049",
      "766361070813315102",
      "852469985163214858",
      "852471384738365480",
      "852471462584385566",
      "852471480495243265",
      "852471492657938442",
      "852471502418083840",
      "852471514904920075",
      "852471524829036544",
      "806742949756796948",
      "766338637368524820",
      "766337433712197642",
      "766338782273732649",
      "766339616944816179",
      "789854158995324958",
      "818960617972957195"
    ];
  }
}

module.exports = role_remove;

class complete {
  #DTT;

  constructor(DTT) {
    this.name = "regenerate";
    this.#DTT = DTT;
  }

  async traditional(interaction) {
    const text = interaction.options.first().value;

    interaction.defer({
      ephemeral: true
    })

    switch (text) {
      case "roles":
        await this.roles(interaction.channel);
        break;
      default:
        return interaction.reply({
          content: "Cannot interpret the provided channel name.",
          ephemeral: true
        });
    }

    interaction.deleteReply();
  }

  async roles(channel) {
    await channel.send("Please use the buttons to self-assign roles to help identify testers!");

    await channel.send({
      content: "**__macOS__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "macOS El Capitan",
            customID: this.#DTT.role("macOS El Capitan").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "macOS Sierra",
            customID: this.#DTT.role("macOS Sierra").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "macOS High Sierra",
            customID: this.#DTT.role("macOS High Sierra").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "macOS Mojave",
            customID: this.#DTT.role("macOS Mojave").id,
            style: "PRIMARY"
          }
        ],
        [
          {
            type: "BUTTON",
            label: "macOS Catalina",
            customID: this.#DTT.role("macOS Catalina").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "macOS Big Sur",
            customID: this.#DTT.role("macOS Big Sur").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "macOS Monterey",
            customID: this.#DTT.role("macOS Monterey").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Linux__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Linux",
            customID: this.#DTT.role("Linux").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Windows__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Windows 7",
            customID: this.#DTT.role("Windows 7").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Windows 8",
            customID: this.#DTT.role("Windows 8").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Windows 10",
            customID: this.#DTT.role("Windows 10").id,
            style: "PRIMARY"
          },
        ]
      ]
    });

    await channel.send({
      content: "**__iOS__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "iPhone",
            customID: this.#DTT.role("iPhone").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iPod",
            customID: this.#DTT.role("iPod").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iPad",
            customID: this.#DTT.role("iPad").id,
            style: "PRIMARY"
          }
        ],
        [
          {
            type: "BUTTON",
            label: "iOS 10",
            customID: this.#DTT.role("iOS 10").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iOS 11",
            customID: this.#DTT.role("iOS 11").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iOS 12",
            customID: this.#DTT.role("iOS 12").id,
            style: "PRIMARY"
          }
        ],
        [
          {
            type: "BUTTON",
            label: "iOS 13",
            customID: this.#DTT.role("iOS 13").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iOS 14",
            customID: this.#DTT.role("iOS 14").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iOS 15",
            customID: this.#DTT.role("iOS 15").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Android__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Android 5",
            customID: this.#DTT.role("Android 5").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android 6",
            customID: this.#DTT.role("Android 6").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android 7",
            customID: this.#DTT.role("Android 7").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android 8",
            customID: this.#DTT.role("Android 8").id,
            style: "PRIMARY"
          }
        ],
        [
          {
            type: "BUTTON",
            label: "Android 9",
            customID: this.#DTT.role("Android 9").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android 10",
            customID: this.#DTT.role("Android 10").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android 11",
            customID: this.#DTT.role("Android 11").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android 12",
            customID: this.#DTT.role("Android 12").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Chromebook__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Chromebook",
            customID: this.#DTT.role("Chromebook").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Accessories__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Mobile Hardware Keyboard",
            customID: this.#DTT.role("Mobile Hardware Keyboard").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Apple Pencil",
            customID: this.#DTT.role("Apple Pencil").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Apple Watch",
            customID: this.#DTT.role("Apple Watch").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Miscellaneous__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Touchscreen PC",
            customID: this.#DTT.role("Touchscreen PC").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "GDPR",
            customID: this.#DTT.role("GDPR").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Experiments__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Stickers",
            customID: this.#DTT.role("Stickers").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send("There are also other roles we use for notifying purposes. Check them out!");

    await channel.send({
      content: "**__Discord Updates__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Status Updates",
            customID: this.#DTT.role("Status Updates").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Canary Updates",
            customID: this.#DTT.role("Canary Updates").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "PTB Updates",
            customID: this.#DTT.role("PTB Updates").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Stable Updates",
            customID: this.#DTT.role("Stable Updates").id,
            style: "PRIMARY"
          }
        ]
      ]
    });

    await channel.send({
      content: "**__Phabricator Updates__**",
      components: [
        [
          {
            type: "BUTTON",
            label: "Desktop",
            customID: this.#DTT.role("Desktop").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Android",
            customID: this.#DTT.role("Android").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "iOS",
            customID: this.#DTT.role("iOS").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "DBug",
            customID: this.#DTT.role("DBug").id,
            style: "PRIMARY"
          },
          {
            type: "BUTTON",
            label: "Boardless",
            customID: this.#DTT.role("Boardless").id,
            style: "PRIMARY"
          }
        ]
      ]
    });
  }

  get commandData() {
    return [
      {
        name: "regenerate",
        description: "Used for regenerating a channel's information.",
        options: [
          {
            type: "STRING",
            name: "channel_name",
            description: "Name of the channel to regenerate.",
            required: true
          }
        ]
      },
      [
        {
          id: this.#DTT.guild.roles.everyone.id,
          type: "ROLE",
          permission: false
        },
        {
          id: this.#DTT.role("Admin").id,
          type: "ROLE",
          permission: true
        }
      ]
    ];
  }
}

module.exports = complete;

class complete {
  #DTT;

  constructor(DTT) {
    this.name = "regenerate";
    this.#DTT = DTT;
  }

  async traditional(interaction) {
    const channel = interaction.channel;

    if (!channel.permissionsFor(this.#DTT.user).has([
      "VIEW_CHANNEL",
      "SEND_MESSAGES"
    ])) return interaction.reply({
      content: "`VIEW_CHANNEL` & `SEND_MESSAGES` are required to execute this command here.",
      ephemeral: true
    });

    const text = interaction.options.getString("channel_name");

    await interaction.defer({
      ephemeral: true
    });

    switch (text) {
      case "read-me":
        await this.readMe(channel);
        break;
      case "roles":
        await this.roles(channel);
        break;
    }

    interaction.editReply("Channel regenerated.");
  }

  async readMe(channel) {
    const message1 = await channel.send({
      content: `Welcome to **${this.#DTT.guild.name}**!\n\nThe purpose of this server is to bring T2+ people together to test Discord! As such, this server is open to those who are currently at least T2 on Discord Testers. Those who fall below this requirement whilst a member will be removed.\n\n**__Rules__**\n1) This server is not endorsed by Discord Testers. Therefore, please do not advertise it on Discord Testers.\n2) Reserved.\n3) Follow Discord's Terms of Service (https://dis.gd/ToS) and Community Guidelines (https://dis.gd/guidelines)\n4) This is not a comprehensive list of rules; anything prohibited in Discord Testers is probably prohibited here. Follow the ${this.#DTT.role("Moderator")}s' instructions.\n\nRead below for an explanation of categories!\n\n**__${this.#DTT.kanal("Information").name}__**\nYou are here! This category contains an introduction to the server. This channel also includes ${this.#DTT.kanal("announcements")} and ${this.#DTT.kanal("roles")} which you can view once admitted to the server.\n\n**__${this.#DTT.kanal("General").name}__**\nHome to ${this.#DTT.kanal("general")} (off-topic chat) and ${this.#DTT.kanal("bot-commands")} and other channels which may show up from time to time.\n\n**__${this.#DTT.kanal("DT General").name}__**\nChannels in this category relate specifically to Discord Testers, such as:\n• ${this.#DTT.kanal("a11y")}\n• ${this.#DTT.kanal("resources")}\n• ${this.#DTT.kanal("bugmail-queue")}\n• ${this.#DTT.kanal("bugmail-discussion")}\n\n**__Testing Categories__**\nThe purpose of these categories are to test bugs specific to the respective platform. These categories also include information related to the platform from Phabricator. Each category also includes a discussion channel, as well as a channel for known issues. Phabricator channels that aren't specific to a testing category fit into ${this.#DTT.kanal("DT General").name}.\n\n**__${this.#DTT.kanal("Discord Updates").name}__**\nUpdates are sent when there is a new Stable, PTB or Canary build (or host) available and also for when there is a new status issue recorded on https://dis.gd/status.\n\n**__Invite__**\nThe \`/invite\` Slash Command can be used to generate a one-time invite to this server. Wait a day before inviting a new T2 please.`,
      allowedMentions: {
        parse: []
      }
    });

    message1.suppressEmbeds();
  }

  async roles(channel) {
    await channel.send("Please use the buttons to self-assign roles to help identify testers!");

    await channel.send({
      content: "**__macOS__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "macOS El Capitan",
              customId: `ROLE-${this.#DTT.role("macOS El Capitan").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "macOS Sierra",
              customId: `ROLE-${this.#DTT.role("macOS Sierra").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "macOS High Sierra",
              customId: `ROLE-${this.#DTT.role("macOS High Sierra").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "macOS Mojave",
              customId: `ROLE-${this.#DTT.role("macOS Mojave").id}`,
              style: "PRIMARY"
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "macOS Catalina",
              customId: `ROLE-${this.#DTT.role("macOS Catalina").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "macOS Big Sur",
              customId: `ROLE-${this.#DTT.role("macOS Big Sur").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "macOS Monterey",
              customId: `ROLE-${this.#DTT.role("macOS Monterey").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Linux__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Linux",
              customId: `ROLE-${this.#DTT.role("Linux").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Windows__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Windows 7",
              customId: `ROLE-${this.#DTT.role("Windows 7").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Windows 8",
              customId: `ROLE-${this.#DTT.role("Windows 8").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Windows 10",
              customId: `ROLE-${this.#DTT.role("Windows 10").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Windows 11",
              customId: `ROLE-${this.#DTT.role("Windows 11").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__iOS__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "iPhone",
              customId: `ROLE-${this.#DTT.role("iPhone").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iPod",
              customId: `ROLE-${this.#DTT.role("iPod").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iPad",
              customId: `ROLE-${this.#DTT.role("iPad").id}`,
              style: "PRIMARY"
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "iOS 10",
              customId: `ROLE-${this.#DTT.role("iOS 10").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iOS 11",
              customId: `ROLE-${this.#DTT.role("iOS 11").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iOS 12",
              customId: `ROLE-${this.#DTT.role("iOS 12").id}`,
              style: "PRIMARY"
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "iOS 13",
              customId: `ROLE-${this.#DTT.role("iOS 13").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iOS 14",
              customId: `ROLE-${this.#DTT.role("iOS 14").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iOS 15",
              customId: `ROLE-${this.#DTT.role("iOS 15").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Android__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Android Alpha",
              customId: `ROLE-${this.#DTT.role("Android Alpha").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android 5",
              customId: `ROLE-${this.#DTT.role("Android 5").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android 6",
              customId: `ROLE-${this.#DTT.role("Android 6").id}`,
              style: "PRIMARY"
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Android 7",
              customId: `ROLE-${this.#DTT.role("Android 7").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android 8",
              customId: `ROLE-${this.#DTT.role("Android 8").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android 9",
              customId: `ROLE-${this.#DTT.role("Android 9").id}`,
              style: "PRIMARY"
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Android 10",
              customId: `ROLE-${this.#DTT.role("Android 10").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android 11",
              customId: `ROLE-${this.#DTT.role("Android 11").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android 12",
              customId: `ROLE-${this.#DTT.role("Android 12").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Chromebook__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Chromebook",
              customId: `ROLE-${this.#DTT.role("Chromebook").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Accessories__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Mobile Hardware Keyboard",
              customId: `ROLE-${this.#DTT.role("Mobile Hardware Keyboard").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Apple Pencil",
              customId: `ROLE-${this.#DTT.role("Apple Pencil").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Apple Watch",
              customId: `ROLE-${this.#DTT.role("Apple Watch").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Miscellaneous__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Touchscreen PC",
              customId: `ROLE-${this.#DTT.role("Touchscreen PC").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "GDPR",
              customId: `ROLE-${this.#DTT.role("GDPR").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send("**__Experiments__**\n\nThere are currently no experiment roles.");

    await channel.send("There are also other roles we use for notifying purposes. Check them out!");

    await channel.send({
      content: "**__Discord Updates__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Status Updates",
              customId: `ROLE-${this.#DTT.role("Status Updates").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Canary Updates",
              customId: `ROLE-${this.#DTT.role("Canary Updates").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "PTB Updates",
              customId: `ROLE-${this.#DTT.role("PTB Updates").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Stable Updates",
              customId: `ROLE-${this.#DTT.role("Stable Updates").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });

    await channel.send({
      content: "**__Phabricator Updates__**",
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Desktop",
              customId: `ROLE-${this.#DTT.role("Desktop").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Android",
              customId: `ROLE-${this.#DTT.role("Android").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "iOS",
              customId: `ROLE-${this.#DTT.role("iOS").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "DBug",
              customId: `ROLE-${this.#DTT.role("DBug").id}`,
              style: "PRIMARY"
            },
            {
              type: "BUTTON",
              label: "Boardless",
              customId: `ROLE-${this.#DTT.role("Boardless").id}`,
              style: "PRIMARY"
            }
          ]
        }
      ]
    });
  }

  get commandData() {
    return {
      applicationCommandData: {
        name: "regenerate",
        description: "Regenerates a channel's information.",
        options: [
          {
            type: "STRING",
            name: "channel_name",
            description: "Name of the channel to regenerate.",
            required: true,
            choices: [
              {
                name: "Roles",
                value: "roles"
              },
              {
                name: "Read Me",
                value: "read-me"
              }
            ]
          }
        ],
        defaultPermission: false
      },
      permissions: [
        {
          id: this.#DTT.role("Admin").id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

module.exports = complete;

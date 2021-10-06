import { ButtonInteraction, CommandInteraction, CommandStructure, Constants, GuildMember, MessageActionRowOptions, MessageSelectOptionData, RoleCategories, RolesCommand, RoleStructure, SelectMenuInteraction, SubRoleCategories } from "discord.js";
import DTT from "../../Client/Client.js";

export default class implements RolesCommand {
  readonly name = "roles";
  readonly type = Constants.ApplicationCommandTypes.CHAT_INPUT;

  readonly categories: RoleCategories[] = [
    "macOS",
    "Linux",
    "Windows",
    "Android",
    "iOS",
    "Chrome OS",
    "Miscellaneous",
    "Experiments",
    "Discord Updates",
    "Phabricator Updates"
  ];

  async handle(interaction: ButtonInteraction | CommandInteraction): Promise<void> {
    return await this.execute(interaction);
  }

  async execute(interaction: ButtonInteraction | CommandInteraction): Promise<void> {
    const content = "Choose a category to self-assign roles from!";

    const components: MessageActionRowOptions[] = [
      {
        type: "ACTION_ROW",
        components: [
          {
            type: "SELECT_MENU",
            customId: "SELFROLE_CATEGORY",
            placeholder: "Choose a category!",
            minValues: 1,
            maxValues: 1,
            options: this.categories.map(category => ({
              label: category,
              value: category,
              default: false
            })),
            disabled: false
          }
        ]
      }
    ];

    if (interaction instanceof ButtonInteraction) {
      await interaction.update({
        content,
        components
      });
    } else {
      await interaction.reply({
        content,
        components,
        ephemeral: true
      });
    }
  }

  async categoryInteraction(interaction: SelectMenuInteraction, category: RoleCategories): Promise<void> {
    const components = this.category(interaction.member as GuildMember, category);

    await interaction.update({
      content: "Self-assign roles, or go back!",
      components: [
        ...components,
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: "Back",
              customId: "SELFROLE_BACK",
              style: "PRIMARY",
              disabled: false
            }
          ]
        }
      ]
    });
  }

  category(guildMember: GuildMember, category: RoleCategories): MessageActionRowOptions[] {
    const options = (componentOptions: RoleStructure[]): MessageSelectOptionData[] => componentOptions.map(({ role, emoji }) => ({
      label: role.name,
      value: role.id,
      emoji: emoji,
      default: guildMember.roles.cache.has(role.id)
    }));

    if (category === "macOS") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-macOSVersionRoles",
              placeholder: "Assign macOS version roles!",
              minValues: 0,
              maxValues: this.macOSVersionRoles.length,
              options: options(this.macOSVersionRoles)
            }
          ]
        }
      ];
    }

    if (category === "Linux") {
      const emoji = this.linux.emoji;

      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: this.linux.role.name,
              customId: `SELFROLE-${this.linux.role.id}`,
              style: "PRIMARY",
              emoji: typeof emoji === "string" ? emoji : emoji.id
            }
          ]
        }
      ];
    }

    if (category === "Windows") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-windowsVersionRoles",
              placeholder: "Assign Windows version roles!",
              minValues: 0,
              maxValues: this.windowsVersionRoles.length,
              options: options(this.windowsVersionRoles)
            }
          ]
        }
      ];
    }

    if (category === "Android") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-androidDeviceRoles",
              placeholder: "Assign Android device roles!",
              minValues: 0,
              maxValues: this.androidDeviceRoles.length,
              options: options(this.androidDeviceRoles)
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-androidVersionRoles",
              placeholder: "Assign Android version roles!",
              minValues: 0,
              maxValues: this.androidVersionRoles.length,
              options: options(this.androidVersionRoles)
            }
          ]
        }
      ];
    }

    if (category === "iOS") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-iOSDeviceRoles",
              placeholder: "Assign iOS device roles!",
              minValues: 0,
              maxValues: this.iOSDeviceRoles.length,
              options: options(this.iOSDeviceRoles)
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-iOSVersionRoles",
              placeholder: "Assign iOS version roles!",
              minValues: 0,
              maxValues: this.iOSVersionRoles.length,
              options: options(this.iOSVersionRoles)
            }
          ]
        },
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-iOSMiscellaneousRoles",
              placeholder: "Assign miscellanous iOS info!",
              minValues: 0,
              maxValues: this.iOSMiscellaneousRoles.length,
              options: options(this.iOSMiscellaneousRoles)
            }
          ]
        }
      ];
    }

    if (category === "Chrome OS") {
      const emoji = this.chromebook.emoji;

      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: this.chromebook.role.name,
              customId: `SELFROLE-${this.chromebook.role.id}`,
              style: "PRIMARY",
              emoji: typeof emoji === "string" ? emoji : emoji.id
            }
          ]
        }
      ];
    }

    if (category === "Miscellaneous") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-miscellaneousRoles",
              placeholder: "Assign miscellanous roles!",
              minValues: 0,
              maxValues: this.miscellaneousRoles.length,
              options: options(this.miscellaneousRoles)
            }
          ]
        }
      ];
    }

    if (category === "Experiments") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-experimentRoles",
              placeholder: "Assign Experiment roles!",
              minValues: 0,
              maxValues: this.experimentRoles.length,
              options: options(this.experimentRoles)
            }
          ]
        }
      ];
    }

    if (category === "Discord Updates") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-discordUpdatesRoles",
              placeholder: "Assign Discord updates roles!",
              minValues: 0,
              maxValues: this.discordUpdatesRoles.length,
              options: options(this.discordUpdatesRoles)
            }
          ]
        }
      ];
    }

    if (category === "Phabricator Updates") {
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "SELECT_MENU",
              customId: "SELFROLE-phabricatorUpdatesRoles",
              placeholder: "Assign Phabricator roles!",
              minValues: 0,
              maxValues: this.phabricatorUpdatesRoles.length,
              options: options(this.phabricatorUpdatesRoles)
            }
          ]
        }
      ];
    }

    throw new Error("Unknown category.");
  }

  resolveSelectMenuCategoryRoles(categoryRoleName: SubRoleCategories): RoleStructure[] {
    switch (categoryRoleName) {
      case "macOSVersionRoles":
        return this.macOSVersionRoles;
      case "windowsVersionRoles":
        return this.windowsVersionRoles;
      case "androidDeviceRoles":
        return this.androidDeviceRoles;
      case "androidVersionRoles":
        return this.androidVersionRoles;
      case "iOSDeviceRoles":
        return this.iOSDeviceRoles;
      case "iOSVersionRoles":
        return this.iOSVersionRoles;
      case "iOSMiscellaneousRoles":
        return this.iOSMiscellaneousRoles;
      case "miscellaneousRoles":
        return this.miscellaneousRoles;
      case "experimentRoles":
        return this.experimentRoles;
      case "discordUpdatesRoles":
        return this.discordUpdatesRoles;
      case "phabricatorUpdatesRoles":
        return this.phabricatorUpdatesRoles;
      default:
        throw new ReferenceError("Unknown subrole categories.");
    }
  }

  get macOSVersionRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("macOS El Capitan"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("macOS Sierra"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("macOS High Sierra"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("macOS Mojave"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("macOS Catalina"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("macOS Big Sur"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("macOS Monterey"),
        emoji: DTT.emoji("apple")
      }
    ];
  }

  get linux(): RoleStructure {
    return {
      role: DTT.role("Linux"),
      emoji: DTT.emoji("linux")
    };
  }

  get windowsVersionRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Windows 7"),
        emoji: DTT.emoji("windows7")
      },
      {
        role: DTT.role("Windows 8"),
        emoji: DTT.emoji("windows8")
      },
      {
        role: DTT.role("Windows 10"),
        emoji: DTT.emoji("windows10")
      },
      {
        role: DTT.role("Windows 11"),
        emoji: DTT.emoji("windows11")
      }
    ];
  }

  get androidDeviceRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Pixel"),
        emoji: DTT.emoji("android")
      },
      {
        role: DTT.role("Samsung Galaxy"),
        emoji: DTT.emoji("android")
      }
    ];
  }

  get androidVersionRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Android 5"),
        emoji: DTT.emoji("android5")
      },
      {
        role: DTT.role("Android 6"),
        emoji: DTT.emoji("android6")
      },
      {
        role: DTT.role("Android 7"),
        emoji: DTT.emoji("android7")
      },
      {
        role: DTT.role("Android 8"),
        emoji: DTT.emoji("android8")
      },
      {
        role: DTT.role("Android 9"),
        emoji: DTT.emoji("android9")
      },
      {
        role: DTT.role("Android 10"),
        emoji: DTT.emoji("android10")
      },
      {
        role: DTT.role("Android 11"),
        emoji: DTT.emoji("android11")
      },
      {
        role: DTT.role("Android 12"),
        emoji: DTT.emoji("android12")
      }
    ];
  }

  get iOSDeviceRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("iPhone"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("iPod"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("iPad"),
        emoji: DTT.emoji("apple")
      }
    ];
  }

  get iOSVersionRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("iOS 10"),
        emoji: DTT.emoji("iOS10")
      },
      {
        role: DTT.role("iOS 11"),
        emoji: DTT.emoji("iOS11")
      },
      {
        role: DTT.role("iOS 12"),
        emoji: DTT.emoji("iOS12")
      },
      {
        role: DTT.role("iOS 13"),
        emoji: DTT.emoji("iOS13")
      },
      {
        role: DTT.role("iOS 14"),
        emoji: DTT.emoji("iOS14")
      },
      {
        role: DTT.role("iOS 15"),
        emoji: DTT.emoji("iOS15")
      }
    ];
  }

  get iOSMiscellaneousRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Face ID"),
        emoji: DTT.emoji("faceId")
      },
      {
        role: DTT.role("4-inch"),
        emoji: DTT.emoji("touchId")
      },
      {
        role: DTT.role("Hardware Keyboard"),
        emoji: DTT.emoji("hardwareKeyboard")
      },
      {
        role: DTT.role("Apple Pencil"),
        emoji: DTT.emoji("applePencil")
      },
      {
        role: DTT.role("Apple Watch"),
        emoji: DTT.emoji("appleWatch")
      }
    ];
  }

  get chromebook(): RoleStructure {
    return {
      role: DTT.role("Chromebook"),
      emoji: DTT.emoji("googleChrome")
    };
  }

  get miscellaneousRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Touchscreen PC"),
        emoji: "🖥️"
      },
      {
        role: DTT.role("GDPR"),
        emoji: "🔒"
      }
    ];
  }

  get experimentRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Per-server Avatar"),
        emoji: DTT.emoji("discord")
      },
      {
        role: DTT.role("Student"),
        emoji: DTT.emoji("discord")
      }
    ];
  }

  get discordUpdatesRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Status Updates"),
        emoji: DTT.emoji("discord")
      },
      {
        role: DTT.role("Canary Updates"),
        emoji: DTT.emoji("canary")
      },
      {
        role: DTT.role("PTB Updates"),
        emoji: DTT.emoji("ptb")
      },
      {
        role: DTT.role("Stable Updates"),
        emoji: DTT.emoji("stable")
      }
    ];
  }

  get phabricatorUpdatesRoles(): RoleStructure[] {
    return [
      {
        role: DTT.role("Desktop"),
        emoji: "🖥️"
      },
      {
        role: DTT.role("Android"),
        emoji: DTT.emoji("android")
      },
      {
        role: DTT.role("iOS"),
        emoji: DTT.emoji("apple")
      },
      {
        role: DTT.role("DBug"),
        emoji: "🐛"
      },
      {
        role: DTT.role("Boardless"),
        emoji: "❓"
      },
      {
        role: DTT.role("P0"),
        emoji: "⚠️"
      }
    ];
  }

  get commandData(): CommandStructure {
    return {
      applicationCommandData: {
        name: this.name,
        description: "Yields self-assignable roles.",
        type: this.type,
        defaultPermission: false
      },
      permissions: [
        {
          id: DTT.role("Tester").id,
          type: Constants.ApplicationCommandPermissionTypes.ROLE,
          permission: true
        }
      ]
    };
  }
}

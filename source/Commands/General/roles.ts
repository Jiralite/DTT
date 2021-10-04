import { ButtonInteraction, CommandInteraction, CommandStructure, Constants, GuildMember, MessageActionRowOptions, MessageSelectOptionData, Role, RoleCategories, RolesCommand, SelectMenuInteraction, SubRoleCategories } from "discord.js";
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
    return await Promise.resolve(this.execute(interaction));
  }

  execute(interaction: ButtonInteraction | CommandInteraction): void {
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
      interaction.update({
        content,
        components
      });
    } else {
      interaction.reply({
        content,
        components,
        ephemeral: true
      });
    }
  }

  categoryInteraction(interaction: SelectMenuInteraction, category: RoleCategories): void {
    const components = this.category(interaction.member as GuildMember, category);

    interaction.update({
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
    const options = (componentOptions: Role[]): MessageSelectOptionData[] => componentOptions.map(({ id, name }) => ({
      label: name,
      value: id,
      default: guildMember.roles.cache.has(id)
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
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: this.linux.name,
              customId: `SELFROLE-${this.linux.id}`,
              style: "PRIMARY"
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
      return [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              label: this.chromebook.name,
              customId: `SELFROLE-${this.chromebook.id}`,
              style: "PRIMARY"
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

  resolveSelectMenuCategoryRoles(categoryRoleName: SubRoleCategories): Role[] {
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

  get macOSVersionRoles(): Role[] {
    return [
      DTT.role("macOS El Capitan"),
      DTT.role("macOS Sierra"),
      DTT.role("macOS High Sierra"),
      DTT.role("macOS Mojave"),
      DTT.role("macOS Catalina"),
      DTT.role("macOS Big Sur"),
      DTT.role("macOS Monterey")
    ];
  }

  get linux(): Role {
    return DTT.role("Linux");
  }

  get windowsVersionRoles(): Role[] {
    return [
      DTT.role("Windows 7"),
      DTT.role("Windows 8"),
      DTT.role("Windows 10"),
      DTT.role("Windows 11")
    ];
  }

  get androidDeviceRoles(): Role[] {
    return [
      DTT.role("Pixel"),
      DTT.role("Samsung Galaxy")
    ];
  }

  get androidVersionRoles(): Role[] {
    return [
      DTT.role("Android 5"),
      DTT.role("Android 6"),
      DTT.role("Android 7"),
      DTT.role("Android 8"),
      DTT.role("Android 9"),
      DTT.role("Android 10"),
      DTT.role("Android 11"),
      DTT.role("Android 12")
    ];
  }

  get iOSDeviceRoles(): Role[] {
    return [
      DTT.role("iPhone"),
      DTT.role("iPod"),
      DTT.role("iPad")
    ];
  }

  get iOSVersionRoles(): Role[] {
    return [
      DTT.role("iOS 10"),
      DTT.role("iOS 11"),
      DTT.role("iOS 12"),
      DTT.role("iOS 13"),
      DTT.role("iOS 14"),
      DTT.role("iOS 15")
    ];
  }

  get iOSMiscellaneousRoles(): Role[] {
    return [
      DTT.role("Face ID"),
      DTT.role("4-inch"),
      DTT.role("Hardware Keyboard"),
      DTT.role("Apple Pencil"),
      DTT.role("Apple Watch")
    ];
  }

  get chromebook(): Role {
    return DTT.role("Chromebook");
  }

  get miscellaneousRoles(): Role[] {
    return [
      DTT.role("Touchscreen PC"),
      DTT.role("GDPR")
    ];
  }

  get experimentRoles(): Role[] {
    return [
      DTT.role("Per-server Avatar"),
      DTT.role("Student")
    ];
  }

  get discordUpdatesRoles(): Role[] {
    return [
      DTT.role("Status Updates"),
      DTT.role("Canary Updates"),
      DTT.role("PTB Updates"),
      DTT.role("Stable Updates")
    ];
  }

  get phabricatorUpdatesRoles(): Role[] {
    return [
      DTT.role("Desktop"),
      DTT.role("Android"),
      DTT.role("iOS"),
      DTT.role("DBug"),
      DTT.role("Boardless"),
      DTT.role("P0")
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
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

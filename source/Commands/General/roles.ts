import { ButtonInteraction, CommandInteraction, CommandStructure, GuildMember, MessageActionRowOptions, MessageSelectOptionData, Role, RoleCategories, SelectMenuInteraction } from "discord.js";
import DTT from "../../Client/Client";

export default class {
  private readonly DTT: DTT;
  readonly name = "roles";
  readonly categories: RoleCategories[];

  constructor(DTT: DTT) {
    this.DTT = DTT;

    this.categories = [
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
  }

  traditional(interaction: ButtonInteraction | CommandInteraction): void {
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

  get macOSVersionRoles(): Role[] {
    return [
      this.DTT.role("macOS El Capitan"),
      this.DTT.role("macOS Sierra"),
      this.DTT.role("macOS High Sierra"),
      this.DTT.role("macOS Mojave"),
      this.DTT.role("macOS Catalina"),
      this.DTT.role("macOS Big Sur"),
      this.DTT.role("macOS Monterey")
    ] as Role[];
  }

  get linux(): Role {
    return this.DTT.role("Linux") as Role;
  }

  get windowsVersionRoles(): Role[] {
    return [
      this.DTT.role("Windows 7"),
      this.DTT.role("Windows 8"),
      this.DTT.role("Windows 10"),
      this.DTT.role("Windows 11")
    ] as Role[];
  }

  get androidDeviceRoles(): Role[] {
    return [
      this.DTT.role("Pixel"),
      this.DTT.role("Samsung Galaxy")
    ] as Role[];
  }

  get androidVersionRoles(): Role[] {
    return [
      this.DTT.role("Android 5"),
      this.DTT.role("Android 6"),
      this.DTT.role("Android 7"),
      this.DTT.role("Android 8"),
      this.DTT.role("Android 9"),
      this.DTT.role("Android 10"),
      this.DTT.role("Android 11"),
      this.DTT.role("Android 12")
    ] as Role[];
  }

  get iOSDeviceRoles(): Role[] {
    return [
      this.DTT.role("iPhone"),
      this.DTT.role("iPod"),
      this.DTT.role("iPad")
    ] as Role[];
  }

  get iOSVersionRoles(): Role[] {
    return [
      this.DTT.role("iOS 10"),
      this.DTT.role("iOS 11"),
      this.DTT.role("iOS 12"),
      this.DTT.role("iOS 13"),
      this.DTT.role("iOS 14"),
      this.DTT.role("iOS 15")
    ] as Role[];
  }

  get iOSMiscellaneousRoles(): Role[] {
    return [
      this.DTT.role("Face ID"),
      this.DTT.role("4-inch"),
      this.DTT.role("Hardware Keyboard"),
      this.DTT.role("Apple Pencil"),
      this.DTT.role("Apple Watch")
    ] as Role[];
  }

  get chromebook(): Role {
    return this.DTT.role("Chromebook") as Role;
  }

  get miscellaneousRoles(): Role[] {
    return [
      this.DTT.role("Touchscreen PC"),
      this.DTT.role("GDPR")
    ] as Role[];
  }

  get experimentRoles(): Role[] {
    return [
      this.DTT.role("Per-server Avatar"),
      this.DTT.role("Student")
    ] as Role[];
  }

  get discordUpdatesRoles(): Role[] {
    return [
      this.DTT.role("Status Updates"),
      this.DTT.role("Canary Updates"),
      this.DTT.role("PTB Updates"),
      this.DTT.role("Stable Updates")
    ] as Role[];
  }

  get phabricatorUpdatesRoles(): Role[] {
    return [
      this.DTT.role("Desktop"),
      this.DTT.role("Android"),
      this.DTT.role("iOS"),
      this.DTT.role("DBug"),
      this.DTT.role("Boardless"),
      this.DTT.role("P0")
    ] as Role[];
  }

  get commandData(): CommandStructure {
    const tester = this.DTT.role("Tester");
    if (tester === null) throw new ReferenceError("Could not find the Tester role.");

    return {
      applicationCommandData: {
        name: "roles",
        description: "Yields self-assignable roles.",
        defaultPermission: false
      },
      permissions: [
        {
          id: tester.id,
          type: "ROLE",
          permission: true
        }
      ]
    };
  }
}

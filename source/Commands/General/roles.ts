import { ButtonInteraction, CommandInteraction, Constants, GuildMember, MessageActionRow, MessageButton, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import DTT from "../../Client/Client.js";
import { CommandStructure, RoleCategories, RolesCommand, RoleStructure, SubRoleCategories } from "../index.js";

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

  async handle(interaction: ButtonInteraction<"cached"> | CommandInteraction<"cached">): Promise<void> {
    return await this.execute(interaction);
  }

  async execute(interaction: ButtonInteraction<"cached"> | CommandInteraction<"cached">): Promise<void> {
    const content = "Choose a category to self-assign roles from!";
    const actionRow = new MessageActionRow();
    const selectMenu = new MessageSelectMenu();

    selectMenu.setOptions(this.categories.map(category => ({
      label: category,
      value: category,
      default: false
    })));

    selectMenu.setCustomId("SELFROLE_CATEGORY");
    selectMenu.setMaxValues(1);
    selectMenu.setMinValues(1);
    selectMenu.setPlaceholder("Choose a category!");
    actionRow.addComponents(selectMenu);

    if (interaction instanceof ButtonInteraction) {
      await interaction.update({
        content,
        components: [
          actionRow
        ]
      });
    } else {
      await interaction.reply({
        content,
        components: [
          actionRow
        ],
        ephemeral: true
      });
    }
  }

  async categoryInteraction(interaction: SelectMenuInteraction, category: RoleCategories): Promise<void> {
    const components = this.category(interaction.member as GuildMember, category);
    const actionRow = new MessageActionRow();
    const button = new MessageButton();
    button.setCustomId("SELFROLE_BACK");
    button.setLabel("Back");
    button.setStyle(Constants.MessageButtonStyles.PRIMARY);
    actionRow.addComponents(button);

    await interaction.update({
      content: "Self-assign roles, or go back!",
      components: [
        ...components,
        actionRow
      ]
    });
  }

  category(guildMember: GuildMember, category: RoleCategories): MessageActionRow[] {
    const options = (componentOptions: RoleStructure[]): MessageSelectOptionData[] => componentOptions.map(({ role, emoji }) => ({
      label: role.name,
      value: role.id,
      emoji: emoji,
      default: guildMember.roles.cache.has(role.id)
    }));

    if (category === "macOS") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.macOSVersionRoles));
      selectMenu.setCustomId("SELFROLE-macOSVersionRoles");
      selectMenu.setMaxValues(this.macOSVersionRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign macOS version roles!");
      actionRow.addComponents(selectMenu);

      return [
        actionRow
      ];
    }

    if (category === "Linux") {
      const actionRow = new MessageActionRow();
      const button = new MessageButton();
      button.setCustomId(`SELFROLE-${this.linux.role.id}`);
      button.setEmoji(this.linux.emoji);
      button.setLabel(this.linux.role.name);
      button.setStyle(Constants.MessageButtonStyles.PRIMARY);
      actionRow.addComponents(button);

      return [
        actionRow
      ];
    }

    if (category === "Windows") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.windowsVersionRoles));
      selectMenu.setCustomId("SELFROLE-windowsVersionRoles");
      selectMenu.setMaxValues(this.windowsVersionRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign Windows version roles!");
      actionRow.addComponents(selectMenu);

      return [
        actionRow
      ];
    }

    if (category === "Android") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.androidDeviceRoles));
      selectMenu.setCustomId("SELFROLE-androidDeviceRoles");
      selectMenu.setMaxValues(this.androidDeviceRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign Android device roles!");
      actionRow.addComponents(selectMenu);

      const actionRow2 = new MessageActionRow();
      const selectMenu2 = new MessageSelectMenu();
      selectMenu2.addOptions(options(this.androidVersionRoles));
      selectMenu2.setCustomId("SELFROLE-androidVersionRoles");
      selectMenu2.setMaxValues(this.androidVersionRoles.length);
      selectMenu2.setMinValues(0);
      selectMenu2.setPlaceholder("Assign Android version roles!");
      actionRow2.addComponents(selectMenu2);

      return [
        actionRow,
        actionRow2
      ];
    }

    if (category === "iOS") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.iOSDeviceRoles));
      selectMenu.setCustomId("SELFROLE-iOSDeviceRoles");
      selectMenu.setMaxValues(this.iOSDeviceRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign iOS device roles!");
      actionRow.addComponents(selectMenu);

      const actionRow2 = new MessageActionRow();
      const selectMenu2 = new MessageSelectMenu();
      selectMenu2.addOptions(options(this.iOSVersionRoles));
      selectMenu2.setCustomId("SELFROLE-iOSVersionRoles");
      selectMenu2.setMaxValues(this.iOSVersionRoles.length);
      selectMenu2.setMinValues(0);
      selectMenu2.setPlaceholder("Assign iOS version roles!");
      actionRow2.addComponents(selectMenu2);

      const actionRow3 = new MessageActionRow();
      const selectMenu3 = new MessageSelectMenu();
      selectMenu3.addOptions(options(this.iOSMiscellaneousRoles));
      selectMenu3.setCustomId("SELFROLE-iOSMiscellaneousRoles");
      selectMenu3.setMaxValues(this.iOSMiscellaneousRoles.length);
      selectMenu3.setMinValues(0);
      selectMenu3.setPlaceholder("Assign miscellanous iOS info!");
      actionRow3.addComponents(selectMenu3);

      return [
        actionRow,
        actionRow2,
        actionRow3
      ];
    }

    if (category === "Chrome OS") {
      const actionRow = new MessageActionRow();
      const button = new MessageButton();
      button.setCustomId(`SELFROLE-${this.chromebook.role.id}`);
      button.setEmoji(this.chromebook.emoji);
      button.setLabel(this.chromebook.role.name);
      button.setStyle(Constants.MessageButtonStyles.PRIMARY);
      actionRow.addComponents(button);

      return [
        actionRow
      ];
    }

    if (category === "Miscellaneous") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.miscellaneousRoles));
      selectMenu.setCustomId("SELFROLE-miscellaneousRoles");
      selectMenu.setMaxValues(this.miscellaneousRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign miscellanous roles!");
      actionRow.addComponents(selectMenu);

      return [
        actionRow
      ];
    }

    if (category === "Experiments") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.experimentRoles));
      selectMenu.setCustomId("SELFROLE-experimentRoles");
      selectMenu.setMaxValues(this.experimentRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign experiment roles!");
      actionRow.addComponents(selectMenu);

      return [
        actionRow
      ];
    }

    if (category === "Discord Updates") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.discordUpdatesRoles));
      selectMenu.setCustomId("SELFROLE-discordUpdatesRoles");
      selectMenu.setMaxValues(this.discordUpdatesRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign Discord updates roles!");
      actionRow.addComponents(selectMenu);

      return [
        actionRow
      ];
    }

    if (category === "Phabricator Updates") {
      const actionRow = new MessageActionRow();
      const selectMenu = new MessageSelectMenu();
      selectMenu.addOptions(options(this.phabricatorUpdatesRoles));
      selectMenu.setCustomId("SELFROLE-phabricatorUpdatesRoles");
      selectMenu.setMaxValues(this.phabricatorUpdatesRoles.length);
      selectMenu.setMinValues(0);
      selectMenu.setPlaceholder("Assign Phabricator roles!");
      actionRow.addComponents(selectMenu);

      return [
        actionRow
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
        role: DTT.role("Video Background"),
        emoji: DTT.emoji("discord")
      },
      {
        role: DTT.role("Account Switching"),
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

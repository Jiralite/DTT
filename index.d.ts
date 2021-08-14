import { Snowflake } from "discord.js";

declare module "discord.js" {
  type VerificationType = "TESTER" | "ALT" | "DENY";
  type FreeBugMailState = "OPEN" | "PENDING" | "DISABLED" | "RESOLVED";
  type RoleCategories = "macOS" | "Linux" | "Windows" | "Android" | "iOS" | "Chrome OS" | "Miscellaneous" | "Experiments" | "Discord Updates" | "Phabricator Updates";
  
  interface CommandStructure {
    applicationCommandData: ApplicationCommandData;
    permissions: ApplicationCommandPermissionData[];
  }

  interface FreeBugMailData {
    No: number | null;
    Timestamp: number;
    "Weekly Timestamp": number;
    "Message ID": Snowflake;
    "User ID": Snowflake;
    "Claimed By ID": Snowflake | null;
    Mentioned: boolean | null;
    State: FreeBugMailState | null;
  }

  interface InviteData {
    No: number | null;
    ID: Snowflake;
    "Created Timestamp": number | null;
    "Expired Timestamp": number | null;
    Expired: boolean | null;
    Code: string | null;
  }

  interface DTTEmojis {
    typing: Snowflake;
  }

  interface DTTChannels {
    Information: Snowflake;
    "read-me": Snowflake;
    verification: Snowflake;
    announcements: Snowflake;
    General: Snowflake;
    general: Snowflake;
    "bot-commands": Snowflake;
    starboard: Snowflake;
    voice: Snowflake;
    Feedback: Snowflake;
    feedback: Snowflake;
    "DT General": Snowflake;
    a11y: Snowflake;
    resources: Snowflake;
    "bugmail-queue": Snowflake;
    "bugmail-discussion": Snowflake;
    "bugmailed-reports": Snowflake;
    "Discord Updates": Snowflake;
    "dtt-bot-log": Snowflake;
    "dtt-bugmail-logs": Snowflake;
    "invite-logs": Snowflake;
  }

  interface DTTRoles {
    Admin: Snowflake;
    "DTT Bot": Snowflake;
    bargebot: Snowflake;
    "Build Bot": Snowflake;
    DUpdate: Snowflake;
    starbot: Snowflake;
    "DT Mod or BA": Snowflake;
    "DT Staff": Snowflake;
    Moderator: Snowflake;
    DJ: Snowflake;
    Muted: Snowflake;
    "1st Place": Snowflake;
    "2nd Place": Snowflake;
    "3rd Place": Snowflake;
    Tester: Snowflake;
    "Alt Account": Snowflake;
    "BW Contributor": Snowflake;
    Bot: Snowflake;
    "Free BugMail": Snowflake;
    Android: Snowflake;
    Desktop: Snowflake;
    iOS: Snowflake;
    DBug: Snowflake;
    Boardless: Snowflake;
    P0: Snowflake;
    "Status Updates": Snowflake;
    "Canary Updates": Snowflake;
    "PTB Updates": Snowflake;
    "Stable Updates": Snowflake;
    "macOS El Capitan": Snowflake;
    "macOS Sierra": Snowflake;
    "macOS High Sierra": Snowflake;
    "macOS Mojave": Snowflake;
    "macOS Catalina": Snowflake;
    "macOS Big Sur": Snowflake;
    "macOS Monterey": Snowflake;
    Linux: Snowflake;
    "Windows 7": Snowflake;
    "Windows 8": Snowflake;
    "Windows 10": Snowflake;
    "Windows 11": Snowflake;
    iPhone: Snowflake;
    iPod: Snowflake;
    iPad: Snowflake;
    "iOS 10": Snowflake;
    "iOS 11": Snowflake;
    "iOS 12": Snowflake;
    "iOS 13": Snowflake;
    "iOS 14": Snowflake;
    "iOS 15": Snowflake;
    "4-inch": Snowflake;
    "Face ID": Snowflake;
    "Apple Watch": Snowflake;
    "Hardware Keyboard": Snowflake;
    "Apple Pencil": Snowflake;
    Pixel: Snowflake;
    "Samsung Galaxy": Snowflake;
    "Android 5": Snowflake;
    "Android 6": Snowflake;
    "Android 7": Snowflake;
    "Android 8": Snowflake;
    "Android 9": Snowflake;
    "Android 10": Snowflake;
    "Android 11": Snowflake;
    "Android 12": Snowflake;
    Chromebook: Snowflake;
    "Touchscreen PC": Snowflake;
    GDPR: Snowflake;
    "Per-server Avatar": Snowflake;
    Student: Snowflake;
    Booster: Snowflake;
  }
}
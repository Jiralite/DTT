import { ApplicationCommandData, ApplicationCommandPermissionData, Snowflake } from "discord.js";

declare module "discord.js" {
  interface CommandStructure {
    applicationCommandData: ApplicationCommandData;
    permissions: ApplicationCommandPermissionData[];
  }

  type VerificationType = "TESTER" | "ALT" | "DENY";
  type FreeBugMailState = "OPEN" | "PENDING" | "DISABLED" | "RESOLVED";

  interface MariaFreeBugMail {
    No: number;
    Timestamp: number;
    "Weekly Timestamp": number;
    "Message ID": Snowflake;
    "User ID": Snowflake;
    "Claimed By ID": Snowflake;
    Mentioned: boolean;
    State: FreeBugMailState;
  }

  interface MariaInvite {
    No: number;
    ID: Snowflake;
    "Created Timestamp": number;
    "Expired Timestamp": number;
    Expired: boolean;
    Code: string;
  }
}
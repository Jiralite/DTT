import { Snowflake } from "discord.js";

declare module "discord.js" {
  type VerificationType = "TESTER" | "ALT" | "DENY";
  type FreeBugMailState = "OPEN" | "PENDING" | "DISABLED" | "RESOLVED";
  
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
}

declare module "mysql" {
  interface KeysData {
    discord: {
      token: string;
    },
    mysql: PoolConfig
  }
}
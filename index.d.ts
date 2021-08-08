type FreeBugMailState = "OPEN | PENDING | DISABLED | RESOLVED";

interface MariaFreeBugMail {
  No: number;
  Timestamp: number;
  "Weekly Timestamp": number;
  "Message ID": string;
  "User ID": string;
  "Claimed By ID": string;
  Mentioned: boolean;
  State: FreeBugMailState;
}

interface MariaInvite {
  No: number;
  ID: string;
  "Created Timestamp": number;
  "Expired Timestamp": number;
  Expired: boolean;
  Code: string;
}
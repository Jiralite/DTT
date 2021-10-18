import { Formatters } from "discord.js";
import DTT from "../Client/Client.js";

const commitInformation = process.env.COMMIT_INFORMATION;
const defaultReturnText = "Selflessly slaving away.";
const baseURL = "https://github.com/";
const repositoryURL = `${baseURL}discord-testers-testers/DTT/`;

async function Maria(): Promise<void> {
  try {
    await DTT.Maria.getConnection();
    await collectFreeBugMails();
    await collectInvites();
  } catch (error) {
    DTT.consoleLog(error);
    process.exit(1);
  }
}

async function collectFreeBugMails(): Promise<void> {
  for (const FreeBugMailPacket of await DTT.Maria.query("SELECT * FROM `Free BugMails`;")) {
    const FreeBugMail = new DTT.FreeBugMail(FreeBugMailPacket);
    DTT.freeBugMails.set(FreeBugMail.No as number, FreeBugMail);
    FreeBugMail.timeout();
    FreeBugMail.mentionedTimeout();
  }
}

async function collectInvites(): Promise<void> {
  for (const invitePacket of await DTT.Maria.query("SELECT * FROM `Invites`;")) {
    const Invite = new DTT.Invite(invitePacket);
    DTT.invites.set(Invite.No as number, Invite);
    Invite.expireTimeout();
  }
}

export default async (): Promise<void> => {
  await Maria();
  if (!commitInformation) return DTT.log(defaultReturnText);
  const commitInformationSplit = commitInformation.split("\n");
  const commitSplit = /commit ([A-Z\d]+) \([A-Z]+ -> (.+?),/i.exec(commitInformationSplit[0]);
  if (!commitSplit) return DTT.log(defaultReturnText);
  const hash = commitSplit[1];
  const branch = commitSplit[2];
  const smallHash = hash.slice(0, 7);
  const author = commitInformationSplit[1].slice(8, commitInformationSplit[1].indexOf("<") - 1);
  const message = commitInformationSplit[4].trim();
  const authorURL = baseURL + author;
  const branchURL = `${repositoryURL}tree/${branch}`;
  const commitURL = `${repositoryURL}commit/${hash}`;

  await DTT.logChannel.send({
    embeds: [
      {
        description: `Running [\`${smallHash}\`](${commitURL}) on [\`${branch}\`](${branchURL}) at ${Formatters.time(Math.floor(Date.now() / 1000))}.\n${message} - [${author}](${authorURL})`,
        timestamp: Date.now(),
        color: (await DTT.guild.members.fetch(DTT.user.id)).displayColor
      }
    ]
  });
};

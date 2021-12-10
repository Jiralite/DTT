import { Formatters, MessageEmbed, TextChannel } from "discord.js";
import { decodeHTML } from "entities";
import fetch from "node-fetch";
import DTT from "../Client/Client.js";
import Invite from "../Client/Invite.js";

const commitInformation = process.env.COMMIT_INFORMATION;
const defaultReturnText = "Selflessly slaving away.";
const baseURL = "https://github.com/";
const repositoryURL = `${baseURL}discord-testers-testers/DTT/`;

const allowedKeywords = [
  "alpha",
  "beta",
  "broke",
  "broken",
  "bug",
  "bugged",
  "bugging",
  "canary",
  "crash",
  "crashed",
  "crashing",
  "does not work",
  "doesn't work",
  "doesnt work",
  "freeze",
  "freezing",
  "frozen",
  "glitch",
  "glitched",
  "glitching",
  "hang",
  "hanging",
  "hangs",
  "macos",
  "ptb",
  "stable",
  "testflight",
  "windows"
];

const keywordsRegExp = new RegExp(`(?:^|[^a-z\\d])(${allowedKeywords.join("|")})(?:[^a-z\\d]|$)`, "i");

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
    const invite = new Invite(invitePacket);
    Invite.cache.set(invite.No, invite);
    if (!invite.isExpired()) invite.expireTimeout();
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
  const branchURL = `${repositoryURL}tree/${encodeURIComponent(branch)}`;
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

  fetchRedditPosts();
};

interface RawRedditDataChildrenDataResponse {
  selftext: string;
  title: string;
  subreddit_name_prefixed: string;
  over_18: boolean;
  id: string;
  author: string;
  created_utc: number;
}

interface RawRedditDataChildrenResponse {
  kind: string;
  data: RawRedditDataChildrenDataResponse;
}

interface RawRedditDataResponse {
  after: string;
  dist: number;
  modhash: string;
  geo_filter: string;
  children: RawRedditDataChildrenResponse[];
}

interface RawRedditResponse {
  kind: string;
  data: RawRedditDataResponse;
}

async function fetchRedditPosts(timestamp = Math.floor(Date.now() / 1000)): Promise<void> {
  try {
    const json = await fetch("https://www.reddit.com/r/discordapp/new.json").then(response => response.json()) as RawRedditResponse;
    const posts = json.data.children;

    const data = posts.filter(({ data: { selftext, title, over_18, created_utc } }) => {
      if (timestamp >= created_utc || over_18) return false;
      return keywordsRegExp.test(selftext) || keywordsRegExp.test(title);
    }).map(({ data }) => {
      const embed = new MessageEmbed();
      embed.setAuthor(data.author, undefined, `https://reddit.com/user/${data.author}`);
      const selfText = decodeHTML(data.selftext);
      embed.setDescription(selfText.length > 4096 ? `${selfText.slice(0, 4093)}...` : selfText);
      embed.setFooter(data.subreddit_name_prefixed);
      embed.setTimestamp(data.created_utc * 1000);
      const title = decodeHTML(data.title);
      embed.setTitle(title.length > 256 ? `${title.slice(0, 253)}...` : title);
      embed.setURL(`https://redd.it/${data.id}`);
      return embed;
    });

    if (data.length > 0) {
      for (const embed of data) {
        await (DTT.channel("reddit") as TextChannel).send({
          embeds: [
            embed.setColor((await DTT.guild.members.fetch(DTT.user.id)).displayColor)
          ]
        });
      }

      timestamp = posts[0].data.created_utc;
    }
  } catch (error) {
    DTT.log("Error during fetchRedditPosts()", error);
  }

  setTimeout(() => fetchRedditPosts(timestamp), 600000); // 10 minutes
}

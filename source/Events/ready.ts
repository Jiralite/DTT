import process from "node:process";
import { Constants, Formatters, MessageEmbed, TextChannel } from "discord.js";
import { decodeHTML } from "entities";
import fetch from "node-fetch";
import DTT, { Maria } from "../Client/Client.js";
import FreeBugMail from "../Client/FreeBugMail.js";
import Invite from "../Client/Invite.js";
import { Event } from "./index.js";

const name = Constants.Events.CLIENT_READY;
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

async function collectFromDatabase(): Promise<void> {
  try {
    await Maria.getConnection();
    await collectFreeBugMails();
    await collectInvites();
  } catch (error) {
    DTT.consoleLog(error);
    process.exit(1);
  }
}

async function collectFreeBugMails(): Promise<void> {
  for (const FreeBugMailPacket of await Maria.query("SELECT * FROM `Free BugMails`;")) {
    const freeBugMail = new FreeBugMail(FreeBugMailPacket);
    FreeBugMail.cache.set(freeBugMail.No, freeBugMail);
    if (freeBugMail.isOpen() && !freeBugMail.mentioned) freeBugMail.mentionedTimeout();
    if (freeBugMail.isPending()) freeBugMail.weeklyTimeout();
  }
}

async function collectInvites(): Promise<void> {
  for (const invitePacket of await Maria.query("SELECT * FROM `Invites`;")) {
    const invite = new Invite(invitePacket);
    Invite.cache.set(invite.No, invite);
    if (!invite.isExpired()) invite.expireTimeout();
  }
}

export const event: Event<typeof name> = {
  name,
  once: true,
  async fire(): Promise<void> {
    await collectFromDatabase();
    if (!commitInformation) return DTT.log(defaultReturnText);
    const commitInformationSplit = commitInformation.split("\n");
    const commitSplit = /commit ([a-z\d]+) \([a-z]+ -> (.+?),/i.exec(commitInformationSplit[0]);
    if (!commitSplit) return DTT.log(defaultReturnText);
    const hash = commitSplit[1];
    const branch = commitSplit[2];
    const smallHash = hash.slice(0, 7);
    const authorLine = commitInformationSplit.find(information => information.startsWith("Author:"));
    const author = authorLine?.slice(8, authorLine.indexOf("<") - 1) ?? null;
    const message = commitInformationSplit[commitInformationSplit.findIndex(information => information.startsWith("Date:")) + 2].trim();
    const authorURL = baseURL + author;
    const branchURL = `${repositoryURL}tree/${encodeURIComponent(branch)}`;
    const commitURL = `${repositoryURL}commit/${hash}`;
    const embed = new MessageEmbed();
    embed.setColor((await DTT.guild.members.fetch(DTT.user.id)).displayColor);
    embed.setDescription(`Running [\`${smallHash}\`](${commitURL}) on [\`${branch}\`](${branchURL}) at ${Formatters.time(Math.floor(Date.now() / 1000))}.\n${message}${author ? ` - [${author}](${authorURL})` : ""}`);
    embed.setTimestamp();

    await DTT.logChannel.send({
      embeds: [
        embed
      ]
    });

    fetchRedditPosts();
  }
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
      embed.setAuthor({ name: data.author, url: `https://reddit.com/user/${data.author}` });
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

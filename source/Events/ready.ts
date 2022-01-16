import process from "node:process";
import { setTimeout } from "node:timers";
import { Constants, Formatters, MessageEmbed, TextChannel } from "discord.js";
import { decodeHTML } from "entities";
import fetch from "node-fetch";
import type { Event } from "./index.js";
import DTT, { Maria } from "../Client/Client.js";
import FreeBugMail from "../Client/FreeBugMail.js";
import Invite from "../Client/Invite.js";
import { repository } from "../Utility/Constants.js";

interface Commit {
  message: string;
}

interface GitHubAuthor {
  login: string;
  html_url: string;
}

interface GitHubCommit {
  sha: string;
  commit: Commit;
  html_url: string;
  author: GitHubAuthor;
}

const name = Constants.Events.CLIENT_READY;
const branch = process.env["BRANCH"];
const commitHash = process.env["COMMIT_HASH"];
const githubToken = process.env["GITHUB_TOKEN"];

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
    // eslint-disable-next-line unicorn/no-process-exit
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
    if (!branch || !commitHash || !githubToken) return DTT.log("Selflessly slaving away.");

    const json = (await fetch(`https://api.github.com/repos/${repository}/commits/${commitHash}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${githubToken}`
      }
    }).then(response => response.json())) as GitHubCommit;

    const embed = new MessageEmbed();
    const member = await DTT.guild.members.fetch(DTT.user.id);
    embed.setColor(member.displayColor);

    embed.setDescription(
      `Running [\`${commitHash.slice(0, 7)}\`](${
        json.html_url
      }) on [\`${branch}\`](https://github.com/${repository}/tree/${branch}) at ${Formatters.time(
        Math.floor(Date.now() / 1000),
        Formatters.TimestampStyles.ShortDateTime
      )}.\n${json.commit.message} - [${json.author.login}](${json.author.html_url})`
    );

    embed.setTimestamp();
    await DTT.logChannel.send({ embeds: [embed] });
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
    const json = (await fetch("https://www.reddit.com/r/discordapp/new.json").then(response =>
      response.json()
    )) as RawRedditResponse;
    const posts = json.data.children;

    const data = posts
      .filter(({ data: { selftext, title, over_18, created_utc } }) => {
        if (timestamp >= created_utc || over_18) return false;
        return keywordsRegExp.test(selftext) || keywordsRegExp.test(title);
      })
      .map(({ data }) => {
        const embed = new MessageEmbed();
        embed.setAuthor({ name: data.author, url: `https://reddit.com/user/${data.author}` });
        const selfText = decodeHTML(data.selftext);
        embed.setDescription(selfText.length > 4096 ? `${selfText.slice(0, 4093)}...` : selfText);
        embed.setFooter({ text: data.subreddit_name_prefixed });
        embed.setTimestamp(data.created_utc * 1000);
        const title = decodeHTML(data.title);
        embed.setTitle(title.length > 256 ? `${title.slice(0, 253)}...` : title);
        embed.setURL(`https://redd.it/${data.id}`);
        return embed;
      });

    if (data.length > 0) {
      for (const embed of data) {
        const member = await DTT.guild.members.fetch(DTT.user.id);
        await (DTT.channel("reddit") as TextChannel).send({
          embeds: [embed.setColor(member.displayColor)]
        });
      }

      timestamp = posts[0]!.data.created_utc;
    }
  } catch (error) {
    DTT.log("Error during fetchRedditPosts()", error);
  }

  setTimeout(() => fetchRedditPosts(timestamp), 600_000); // 10 minutes
}

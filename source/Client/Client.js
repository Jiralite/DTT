const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { createPool } = require("mysql");

const { discord: { prefix }, mysql } = require("./Keys.json");

const FreeBugMail = require("./FreeBugMail.js");
const Verification = require("./Verification.js");
const Maria = createPool(mysql);

class DTT extends Client {
  constructor(options = {}) {
    super(options);
    this.prefix = prefix;
    this.Maria = Maria;
    this.commands = (() => {
      const commandsCollection = new Collection();

      for (const file of readdirSync("./Commands").filter(file => file.endsWith(".js"))) {
        const command = new (require(`../Commands/${file}`))(this);
        command.type = null;
        commandsCollection.set(command.name, command);
      }

      const folders = readdirSync("./Commands", {
        withFileTypes: true
      }).filter(file => file.isDirectory()).map(({ name }) => name);

      folders.forEach(folder => {
        for (const F of readdirSync(`./Commands/${folder}`).filter(file => file.endsWith(".js"))) {
          const command = new (require(`../Commands/${folder}/${F}`))(this);
          commandsCollection.set(command.name, command);
        }
      });

      return commandsCollection;
    })();
    this.FreeBugMail = FreeBugMail;
    this.Verification = Verification;
    this.freeBugMails = new Collection();
  }

  log(message, consoleLog = message) {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;

    this.logChannel.send({
      content: `${stamp} ${message}`,
      allowedMentions: {
        parse: []
      }
    }).catch(error => this.logChannel.send(`${stamp} Couldn't send a response.`));
  }

  freeBugMailLog(message, consoleLog = message) {
    let stamp = new Date().toISOString();
    this.consoleLog(consoleLog, stamp);
    stamp = `\`[${stamp}]\``;
    if (message.length >= 2000) message = `${message.slice(0, 1997)}...`;

    this.freeBugMailLogChannel.send({
      content: `${stamp} ${message}`,
      allowedMentions: {
        parse: []
      }
    }).catch(error => this.freeBugMailLogChannel.send(`${stamp} Couldn't send a response.`));
  }

  consoleLog(consoleLog, stamp = new Date().toISOString()) {
    console.log(`- - - - - ${stamp} - - - - -`);
    console.log(consoleLog);
  }

  async applyCommands() {
    await this.guild.commands.set([]);

    for (const command of this.commands.values()) {
      const [applicationCommandData, permissions] = command.commandData;
      this.guild.commands.create(applicationCommandData).then(createdCommand => createdCommand.setPermissions(permissions));
    }
  }

  kanal(channel) {
    return this.guild.channels.resolve(this.kanaly[channel]);
  }

  role(role) {
    return this.guild.roles.resolve(this.roles[role]);
  }

  get guild() {
    return this.guilds.resolve("765611756441436160");
  }

  get logChannel() {
    return this.kanal("log");
  }

  get freeBugMailLogChannel() {
    return this.kanal("free-bugmail-log");
  }

  get kanaly() {
    return {
      Information: "765620075737776218",
      "read-me": "765620328511963176",
      verification: "765621889682374656",
      roles: "765706613155430411",
      announcements: "765620353191903303",
      General: "765620128356106271",
      general: "765720809519316992",
      "bot-commands": "765623545631735858",
      starboard: "801239097058263061",
      voice: "847280182997286932",
      "invalid-reports": "778797051713814528",
      "locked-reports": "785830225665458227",
      "bugmail-queue": "852581876030898176",
      "bugmail-discussion": "852592316438020136",
      DTT: "853235436063162388",
      log: "853235554375434270",
      "free-bugmail-log": "853243608828346409"
    };
  }

  get roles() {
    return {
      Admin: "765611993532334120",
      "DTT Bot": "765730622302847037",
      bargebot: "765675911432896574",
      "Build Bot": "765633436554625045",
      DUpdate: "765616358019825737",
      starbot: "801238697672048691",
      "DT Mod or BA": "832393264975970306",
      "DT Staff": "776828300450201600",
      Moderator: "815329929838198824",
      DJ: "851574177198899200",
      Muted: "815340396808503367",
      "1st Place": "780624959059132426",
      "2nd Place": "780624987332542465",
      "3rd Place": "780625011605372928",
      Tester: "765638424618074122",
      "Alt Account": "799502317430767647",
      "BW Contributor": "791022460454567947",
      Bot: "765618889316892682",
      "Free BugMail": "852589448070692947",
      Android: "765617891415556106",
      Desktop: "765617904665362472",
      iOS: "765617920134742067",
      DBug: "803250701168934913",
      Boardless: "803327819001364500",
      "Status Updates": "819294185206972416",
      "Canary Updates": "765633934813823008",
      "PTB Updates": "765633896544206848",
      "Stable Updates": "765619042403745844",
      "macOS El Capitan": "852473203623591936",
      "macOS Sierra": "852473381974048819",
      "macOS High Sierra": "852473425179049985",
      "macOS Mojave": "852473455957114910",
      "macOS Catalina": "852473484956401694",
      "macOS Big Sur": "852473513552904202",
      "macOS Monterey": "852473541956861952",
      Linux: "766339902396301322",
      "Windows 7": "852472935163625493",
      "Windows 8": "852472977105747980",
      "Windows 10": "852473007753527346",
      "Windows 11": "858435618861875212",
      iPhone: "766338561405485106",
      iPod: "766338590337794080",
      iPad: "766338608624828426",
      "iOS 10": "852472437509455904",
      "iOS 11": "852472612344823838",
      "iOS 12": "852472632921292820",
      "iOS 13": "852472643386343434",
      "iOS 14": "852472652333711370",
      "iOS 15": "852472663288578049",
      "Android Alpha": "855118301004431380",
      "Android 5": "852469985163214858",
      "Android 6": "852471384738365480",
      "Android 7": "852471462584385566",
      "Android 8": "852471480495243265",
      "Android 9": "852471492657938442",
      "Android 10": "852471502418083840",
      "Android 11": "852471514904920075",
      "Android 12": "852471524829036544",
      Chromebook: "806742949756796948",
      "Mobile Hardware Keyboard": "766338637368524820",
      "Apple Pencil": "766337433712197642",
      "Apple Watch": "766338782273732649",
      "Touchscreen PC": "766339616944816179",
      Stickers: "789854158995324958",
      GDPR: "818960617972957195",
      Shame: "789692216880660561",
    }
  }
}

module.exports = DTT;

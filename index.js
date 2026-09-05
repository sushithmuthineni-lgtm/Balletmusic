require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const {
  Player,
  useMainPlayer,
  useQueue
} = require("discord-player");

const {
  DefaultExtractors
} = require("@discord-player/extractor");

const { YoutubeiExtractor } = require("discord-player-youtubei");

// -----------------------------
// CLIENT + PLAYER
// -----------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = new Player(client);

(async () => {
  await player.extractors.register(YoutubeiExtractor, {});
  console.log("✅ Extractors loaded");
})();
// -----------------------------
// SLASH COMMANDS
// -----------------------------

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music")
    .addStringOption(option =>
      option
        .setName("query")
        .setDescription("Song name or supported music URL")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the music"),

  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume the music"),

  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song"),

  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop music and clear queue"),

  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the music queue"),

  new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the current song")
].map(command => command.toJSON());

// -----------------------------
// REGISTER COMMANDS
// -----------------------------

const rest = new REST({ version: "10" })
  .setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error("Command registration error:", error);
  }
}

// -----------------------------
// READY
// -----------------------------

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await player.extractors.loadMulti(DefaultExtractors);

  console.log("🎶 Music extractors loaded");
});

// -----------------------------
// COMMAND HANDLER
// -----------------------------

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  // ---------------------------
  // PLAY
  // ---------------------------

  if (command === "play") {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply(
        "❌ Join a voice channel first."
      );
    }

    const query = interaction.options.getString(
      "query",
      true
    );

    await interaction.deferReply();

    try {
      const mainPlayer = useMainPlayer();

      const { track } = await mainPlayer.play(
        voiceChannel,
        query,
        {
          nodeOptions: {
            metadata: interaction,
            leaveOnEnd: false,
            leaveOnEmpty: false,
            leaveOnEmptyCooldown: 300000
          }
        }
      );

      return interaction.followUp(
        `✅ Added **${track.title}** to the queue.`
      );

    } catch (error) {
      console.error(error);

      return interaction.followUp(
        "❌ I couldn't play that track."
      );
    }
  }

  // ---------------------------
  // PAUSE
  // ---------------------------

  if (command === "pause") {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply(
        "❌ Nothing is playing."
      );
    }

    queue.node.pause();

    return interaction.reply(
      "⏸️ Music paused."
    );
  }

  // ---------------------------
  // RESUME
  // ---------------------------

  if (command === "resume") {
    const queue = useQueue(interaction.guild.id);

    if (!queue) {
      return interaction.reply(
        "❌ Nothing is playing."
      );
    }

    queue.node.resume();

    return interaction.reply(
      "▶️ Music resumed."
    );
  }

  // ---------------------------
  // SKIP
  // ---------------------------

  if (command === "skip") {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply(
        "❌ Nothing is playing."
      );
    }

    const skipped = queue.node.skip();

    if (!skipped) {
      return interaction.reply(
        "❌ Couldn't skip the track."
      );
    }

    return interaction.reply(
      "⏭️ Skipped."
    );
  }

  // ---------------------------
  // STOP
  // ---------------------------

  if (command === "stop") {
    const queue = useQueue(interaction.guild.id);

    if (!queue) {
      return interaction.reply(
        "❌ Nothing is playing."
      );
    }

    queue.delete();

    return interaction.reply(
      "⏹️ Music stopped and queue cleared."
    );
  }

  // ---------------------------
  // QUEUE
  // ---------------------------

  if (command === "queue") {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply(
        "📭 Queue is empty."
      );
    }

    const tracks = queue.tracks.toArray();

    if (tracks.length === 0) {
      return interaction.reply(
        "📭 No songs are waiting."
      );
    }

    const list = tracks
      .slice(0, 10)
      .map(
        (track, index) =>
          `**${index + 1}.** ${track.title}`
      )
      .join("\n");

    return interaction.reply(
      `🎶 **Queue**\n\n${list}`
    );
  }

  // ---------------------------
  // NOW PLAYING
  // ---------------------------

  if (command === "nowplaying") {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.currentTrack) {
      return interaction.reply(
        "📭 Nothing is playing."
      );
    }

    return interaction.reply(
      `🎶 **Now Playing:** ${queue.currentTrack.title}`
    );
  }
});

// -----------------------------
// PLAYER EVENTS
// -----------------------------

player.events.on("playerStart", (queue, track) => {
  const channel = queue.metadata?.channel;

  if (!channel) return;

  channel.send(
    `🎶 Now playing **${track.title}**`
  ).catch(() => {});
});

player.events.on("error", (queue, error) => {
  console.error("Player error:", error);
});

player.events.on("playerError", (queue, error) => {
  console.error("Player error:", error);
});

player.events.on("emptyQueue", queue => {
  console.log(
    `📭 Queue ended in ${queue.guild.name}`
  );
});

// -----------------------------
// LOGIN
// -----------------------------

client.login(process.env.DISCORD_TOKEN)
  .then(() => registerCommands())
  .catch(console.error);

      

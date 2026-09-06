// Must be set before discord-player/prism-media are required, so they pick
// up the bundled ffmpeg binary instead of failing to find ffmpeg on the system.
process.env.FFMPEG_PATH = require('ffmpeg-static');

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || '!';

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN environment variable. Set it in your Railway service variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// discord-player handles queueing, voice connections, and pulling audio
// from YouTube, Spotify (resolved via YouTube), SoundCloud, etc.
const player = new Player(client);

async function setupPlayer() {
  // YoutubeiExtractor gives reliable YouTube playback (Spotify links get
  // resolved to matching YouTube tracks automatically by discord-player).
  await player.extractors.register(YoutubeiExtractor, {});
  await player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');
}

client.once('ready', async () => {
  await setupPlayer();
  console.log(`Logged in as ${client.user.tag}`);
});

// Shared logic used by both the !prefix commands and the /slash commands
async function handlePlay(voiceChannel, query, textChannel) {
  if (!query) throw new Error('Give me a song name, YouTube link, or Spotify link.');
  if (!voiceChannel) throw new Error('Join a voice channel first.');

  const { track } = await player.play(voiceChannel, query, {
    nodeOptions: {
      metadata: { channel: textChannel },
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: 60000,
      leaveOnEnd: true,
      leaveOnEndCooldown: 60000,
    },
  });

  return track;
}

function handleSkip(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue || !queue.isPlaying()) throw new Error('Nothing is playing.');
  queue.node.skip();
}

function handleStop(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue) throw new Error('Nothing is playing.');
  queue.delete();
}

function handlePause(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue || !queue.isPlaying()) throw new Error('Nothing is playing.');
  queue.node.setPaused(true);
}

function handleResume(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue) throw new Error('Nothing is playing.');
  queue.node.setPaused(false);
}

function buildQueueEmbed(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue || queue.tracks.data.length === 0) throw new Error('The queue is empty.');
  const list = queue.tracks.data
    .slice(0, 10)
    .map((t, i) => `${i + 1}. ${t.title}`)
    .join('\n');
  return new EmbedBuilder()
    .setTitle('Queue')
    .setDescription(`Now playing: **${queue.currentTrack?.title || 'N/A'}**\n\n${list}`);
}

function handleVolume(guildId, vol) {
  const queue = player.nodes.get(guildId);
  if (!queue) throw new Error('Nothing is playing.');
  if (isNaN(vol) || vol < 0 || vol > 100) throw new Error('Give a volume between 0 and 100.');
  queue.node.setVolume(vol);
}

function buildNowPlayingEmbed(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue || !queue.currentTrack) throw new Error('Nothing is playing.');
  return new EmbedBuilder()
    .setTitle('Now Playing')
    .setDescription(`**${queue.currentTrack.title}**`)
    .setThumbnail(queue.currentTrack.thumbnail || null);
}

// Slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const voiceChannel = interaction.member?.voice?.channel;

  try {
    if (interaction.commandName === 'play') {
      await interaction.deferReply();
      const query = interaction.options.getString('query', true);
      const track = await handlePlay(voiceChannel, query, interaction.channel);
      await interaction.editReply(`Queued: **${track.title}**`);
    } else if (interaction.commandName === 'skip') {
      handleSkip(interaction.guildId);
      await interaction.reply('Skipped.');
    } else if (interaction.commandName === 'stop') {
      handleStop(interaction.guildId);
      await interaction.reply('Stopped and cleared the queue.');
    } else if (interaction.commandName === 'pause') {
      handlePause(interaction.guildId);
      await interaction.reply('Paused.');
    } else if (interaction.commandName === 'resume') {
      handleResume(interaction.guildId);
      await interaction.reply('Resumed.');
    } else if (interaction.commandName === 'queue') {
      const embed = buildQueueEmbed(interaction.guildId);
      await interaction.reply({ embeds: [embed] });
    } else if (interaction.commandName === 'volume') {
      const level = interaction.options.getInteger('level', true);
      handleVolume(interaction.guildId, level);
      await interaction.reply(`Volume set to ${level}%.`);
    } else if (interaction.commandName === 'nowplaying') {
      const embed = buildNowPlayingEmbed(interaction.guildId);
      await interaction.reply({ embeds: [embed] });
    }
  } catch (err) {
    const msg = err.message || 'Something went wrong with that command.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg);
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  const voiceChannel = message.member?.voice?.channel;

  try {
    if (command === 'play' || command === 'p') {
      const query = args.join(' ');
      if (!query) return message.reply('Give me a song name, YouTube link, or Spotify link.');
      if (!voiceChannel) return message.reply('Join a voice channel first.');

      const { track } = await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: { channel: message.channel },
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 60000,
        },
      });

      message.reply(`Queued: **${track.title}**`);
    } else if (command === 'skip') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue || !queue.isPlaying()) return message.reply('Nothing is playing.');
      queue.node.skip();
      message.reply('Skipped.');
    } else if (command === 'stop') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply('Nothing is playing.');
      queue.delete();
      message.reply('Stopped and cleared the queue.');
    } else if (command === 'pause') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue || !queue.isPlaying()) return message.reply('Nothing is playing.');
      queue.node.setPaused(true);
      message.reply('Paused.');
    } else if (command === 'resume') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply('Nothing is playing.');
      queue.node.setPaused(false);
      message.reply('Resumed.');
    } else if (command === 'queue' || command === 'q') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue || queue.tracks.data.length === 0) {
        return message.reply('The queue is empty.');
      }
      const list = queue.tracks.data
        .slice(0, 10)
        .map((t, i) => `${i + 1}. ${t.title}`)
        .join('\n');
      const embed = new EmbedBuilder()
        .setTitle('Queue')
        .setDescription(`Now playing: **${queue.currentTrack?.title || 'N/A'}**\n\n${list}`);
      message.reply({ embeds: [embed] });
    } else if (command === 'volume' || command === 'vol') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply('Nothing is playing.');
      const vol = parseInt(args[0], 10);
      if (isNaN(vol) || vol < 0 || vol > 100) return message.reply('Give a volume between 0 and 100.');
      queue.node.setVolume(vol);
      message.reply(`Volume set to ${vol}%.`);
    } else if (command === 'help') {
      message.reply(
        `**Commands** (prefix \`${PREFIX}\`)\n` +
          `\`play <song/YouTube/Spotify link>\` - play or queue a track\n` +
          `\`skip\` - skip current track\n` +
          `\`stop\` - stop and clear queue\n` +
          `\`pause\` / \`resume\`\n` +
          `\`queue\` - show upcoming tracks\n` +
          `\`volume <0-100>\``
      );
    }
  } catch (err) {
    console.error(err);
    message.reply('Something went wrong with that command.');
  }
});

player.events.on('playerStart', (queue, track) => {
  queue.metadata.channel.send(`▶️ Now playing: **${track.title}**`);
});

player.events.on('audioTrackAdd', (queue, track) => {
  // Skip the "queued" notice for the very first track (handled by the reply above)
});

player.events.on('error', (queue, error) => {
  console.error('Player error:', error);
});

player.events.on('playerError', (queue, error) => {
  console.error('Playback error:', error);
});

player.events.on('emptyQueue', (queue) => {
  console.log(`Queue ended for guild ${queue.guild.id}`);
});

player.events.on('disconnect', (queue) => {
  console.log(`Disconnected from voice in guild ${queue.guild.id}`);
});

client.login(TOKEN);
  

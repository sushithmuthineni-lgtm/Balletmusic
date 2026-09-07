const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.env.FFMPEG_PATH = require('ffmpeg-static');

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || '!';

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN environment variable.');
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

// Force the voice connection to use a stable gateway version
// This prevents cloud hosting data packets from dropping silently
try {
  require('@discordjs/voice').GatewayVersion = '10';
} catch (e) {
  console.error('Voice helper initialization warning:', e);
}

client.on('error', (error) => {
  console.error('Discord Client Error:', error);
});

const player = new Player(client);

async function setupPlayer() {
  try {
    await player.extractors.loadDefault();
    console.log('Audio extractors loaded successfully!');
  } catch (err) {
    console.error('Failed to load extractors:', err);
  }
}

client.once('ready', async () => {
  await setupPlayer();
  console.log(`Logged in as ${client.user.tag}`);
});

async function handlePlay(voiceChannel, query, textChannel) {
  if (!query) throw new Error('Give me a song name or a direct music link.');
  if (!voiceChannel) throw new Error('Join a voice channel first.');

  const isUrl = query.startsWith('http://') || query.startsWith('https://');
  const fallbackSearchEngine = isUrl ? 'auto' : 'soundcloud';

  const { track } = await player.play(voiceChannel, query, {
    nodeOptions: {
      metadata: { channel: textChannel },
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: 60000,
      leaveOnEnd: true,
      leaveOnEndCooldown: 60000,
    },
    searchEngine: fallbackSearchEngine
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
    const msg = err.message || 'Something went wrong.';
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
      if (!query) return message.reply('Give me a song name.');
      if (!voiceChannel) return message.reply('Join a voice channel first.');

      const isUrl = query.startsWith('http://') || query.startsWith('https://');
      const fallbackSearchEngine = isUrl ? 'auto' : 'soundcloud';

      const { track } = await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: { channel: message.channel },
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 60000,
        },
        searchEngine: fallbackSearchEngine
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
      message.reply('Stopped.');
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
      if (!queue || queue.tracks.data.length === 0) return message.reply('The queue is empty.');
      const list = queue.tracks.data.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join('\n');
      const embed = new EmbedBuilder().setTitle('Queue').setDescription(list);
      message.reply({ embeds: [embed] });
    } else if (command === 'volume' || command === 'vol') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply('Nothing is playing.');
      const vol = parseInt(args, 10);
      if (isNaN(vol) || vol < 0 || vol > 100) return message.reply('Give a volume between 0 and 100.');
      queue.node.setVolume(vol);
      message.reply(`Volume set to ${vol}%.`);
    }
  } catch (err) {
    console.error(err);
    message.reply('Something went wrong.');
  }
});

player.events.on('playerStart', (queue, track) => {
  try { queue.metadata.channel.send(`Now playing: **${track.title}**`); } catch (e) {}
});
player.events.on('audioTrackAdd', () => {});
player.events.on('error', (q, e) => console.error(e));
player.events.on('playerError', (q, e) => console.error(e));
player.events.on('emptyQueue', () => {});
player.events.on('disconnect', () => {});

client.login(TOKEN);


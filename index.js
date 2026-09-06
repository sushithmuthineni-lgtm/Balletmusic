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

client.login(TOKEN);

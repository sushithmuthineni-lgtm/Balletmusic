require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.DEFAULT_PREFIX || '!',
  embedColor: process.env.EMBED_COLOR || '#8e44ec',
  ownerIds: (process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean),

  lavalink: [
    {
      name: process.env.LAVALINK_NAME || 'main',
      url: process.env.LAVALINK_URL,
      auth: process.env.LAVALINK_AUTH,
      secure: process.env.LAVALINK_SECURE === 'true'
    }
  ],

  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || null,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || null
  },

  emojis: {
    play: '▶️',
    pause: '⏸️',
    skip: '⏭️',
    stop: '⏹️',
    loop: '🔁',
    shuffle: '🔀',
    queue: '📜',
    success: '✅',
    error: '❌',
    music: '🎶',
    volume: '🔊'
  }
};

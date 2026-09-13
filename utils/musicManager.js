const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');
const Spotify = require('kazagumo-spotify');
const config = require('../config');
const { infoEmbed, msToTime } = require('./embeds');

// In-memory stores (swap for a DB like SQLite/Mongo if you want persistence across restarts)
const stayIn247 = new Set();   // guildIds with 24/7 enabled
const autoplayOn = new Set();  // guildIds with autoplay enabled
const grabInbox = new Map();   // userId -> [ { title, uri } ]

function createMusicManager(client) {
  const plugins = [];

  if (config.spotify.clientId && config.spotify.clientSecret) {
    plugins.push(
      new Spotify({
        clientId: config.spotify.clientId,
        clientSecret: config.spotify.clientSecret,
        playlistPageLimit: 1,
        albumPageLimit: 1,
        searchLimit: 10
      })
    );
  }

  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: 'youtube',
      plugins,
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      }
    },
    new Connectors.DiscordJS(client),
    config.lavalink
  );

  kazagumo.shoukaku.on('ready', (name) => console.log(`[Lavalink] Node "${name}" connected.`));
  kazagumo.shoukaku.on('error', (name, error) => console.error(`[Lavalink] Node "${name}" error:`, error?.message || error));
  kazagumo.shoukaku.on('close', (name, code, reason) =>
    console.warn(`[Lavalink] Node "${name}" closed. Code ${code}, reason ${reason || 'none'}`)
  );
  kazagumo.shoukaku.on('disconnect', (name) => console.warn(`[Lavalink] Node "${name}" disconnected — will retry.`));

  setTimeout(() => {
    const states = [...kazagumo.shoukaku.nodes.values()].map((n) => `${n.name}: ${n.state}`);
    console.log(`[Lavalink] Node status check (5s after boot): ${states.join(', ') || 'NO NODES CONFIGURED'}`);
  }, 5000);

  // Track end -> autoplay logic
  kazagumo.on('playerEnd', async (player) => {
    if (!autoplayOn.has(player.guildId)) return;
    if (player.queue.length > 0) return; // normal queue still has songs

    const last = player.data.get('lastTrack');
    if (!last) return;

    try {
      const query = `${last.author} ${last.title}`;
      const result = await player.search(query, { requester: last.requester, engine: 'youtube' });
      const filtered = result.tracks.filter((t) => t.uri !== last.uri).slice(0, 5);
      if (filtered.length) {
        const pick = filtered[Math.floor(Math.random() * filtered.length)];
        player.queue.add(pick);
        if (!player.playing && !player.paused) player.play();
      }
    } catch (err) {
      console.error('[Autoplay] failed to fetch next track:', err.message);
    }
  });

  kazagumo.on('playerStart', (player, track) => {
    player.data.set('lastTrack', track);
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
      channel.send({
        embeds: [
          infoEmbed(`Now playing **[${track.title}](${track.uri})** \`[${msToTime(track.length)}]\``)
        ]
      }).catch(() => {});
    }
  });

  // NOTE: Kazagumo's "playerEmpty" fires when the QUEUE runs out of tracks,
  // not when the voice channel is empty of people. Real "everyone left"
  // detection is handled separately in events/voiceStateUpdate.js.
  kazagumo.on('playerEmpty', (player) => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) {
      channel.send({ embeds: [infoEmbed('Queue finished. Add more with `/play`, or I\'ll stay connected idle.')] }).catch(() => {});
    }
  });

  return kazagumo;
}

module.exports = { createMusicManager, stayIn247, autoplayOn, grabInbox };

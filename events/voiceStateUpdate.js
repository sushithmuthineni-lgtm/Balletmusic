const { stayIn247 } = require('../utils/musicManager');
const { infoEmbed } = require('../utils/embeds');

module.exports = {
  name: 'voiceStateUpdate',
  execute(oldState, newState, client) {
    // Only care about someone LEAVING a channel (oldState had a channel)
    const channel = oldState.channel;
    if (!channel) return;

    const player = client.music.players.get(oldState.guild.id);
    if (!player) return;
    if (channel.id !== player.voiceId) return; // not the bot's voice channel

    const humanCount = channel.members.filter((m) => !m.user.bot).size;
    if (humanCount > 0) return; // still people listening

    if (stayIn247.has(oldState.guild.id)) return; // 24/7 mode — stay connected

    const textChannel = client.channels.cache.get(player.textId);
    if (textChannel) {
      textChannel.send({ embeds: [infoEmbed("Everyone left — disconnecting. Use `/247` to keep me here next time.")] }).catch(() => {});
    }
    player.destroy();
  }
};

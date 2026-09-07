function getActivePlayer(interaction, { requireQueue = false } = {}) {
  const music = interaction.client.music;
  const player = music.players.get(interaction.guild.id);

  if (!player) return { error: "I'm not playing anything right now." };

  const voiceChannel = interaction.member.voice?.channel;
  if (!voiceChannel) return { error: 'Join a voice channel first.' };
  if (voiceChannel.id !== player.voiceId) return { error: 'You need to be in my voice channel to do that.' };

  if (requireQueue && !player.queue.current) return { error: 'Nothing is playing right now.' };

  return { player };
}

module.exports = { getActivePlayer };

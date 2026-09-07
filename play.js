const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed, errorEmbed, msToTime } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist from YouTube, Spotify, or SoundCloud')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('Song name or URL').setRequired(true)
    ),

  async execute(interaction) {
    const { member, guild, channel } = interaction;
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ embeds: [errorEmbed('Join a voice channel first.')], ephemeral: true });
    }

    await interaction.deferReply();
    const query = interaction.options.getString('query');
    const music = interaction.client.music;

    let player = music.players.get(guild.id);
    if (!player) {
      player = await music.createPlayer({
        guildId: guild.id,
        textId: channel.id,
        voiceId: voiceChannel.id,
        volume: 80,
        deaf: true
      });
    }

    const result = await music.search(query, { requester: member.user });
    if (!result.tracks.length) {
      return interaction.editReply({ embeds: [errorEmbed('No results found for that query.')] });
    }

    if (result.type === 'PLAYLIST') {
      for (const track of result.tracks) player.queue.add(track);
      await interaction.editReply({
        embeds: [infoEmbed(`Queued playlist **${result.playlistName}** — ${result.tracks.length} tracks.`)]
      });
    } else {
      const track = result.tracks[0];
      player.queue.add(track);
      await interaction.editReply({
        embeds: [infoEmbed(`Queued **[${track.title}](${track.uri})** \`[${msToTime(track.length)}]\``)]
      });
    }

    if (!player.playing && !player.paused) player.play();
  }
};

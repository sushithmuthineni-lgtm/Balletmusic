const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, msToTime } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playnext')
    .setDescription('Add a song to the very front of the queue')
    .addStringOption((opt) => opt.setName('query').setDescription('Song name or URL').setRequired(true)),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) return interaction.reply({ embeds: [errorEmbed('Join a voice channel first.')], ephemeral: true });

    await interaction.deferReply();
    const music = interaction.client.music;
    let player = music.players.get(interaction.guild.id);
    if (!player) {
      player = await music.createPlayer({
        guildId: interaction.guild.id,
        textId: interaction.channel.id,
        voiceId: voiceChannel.id,
        volume: 80,
        deaf: true
      });
    }

    const result = await music.search(interaction.options.getString('query'), { requester: interaction.member.user });
    if (!result.tracks.length) return interaction.editReply({ embeds: [errorEmbed('No results found.')] });

    const track = result.tracks[0];
    player.queue.splice(0, 0, track);
    await interaction.editReply({ embeds: [successEmbed(`**${track.title}** \`[${msToTime(track.length)}]\` will play next.`)] });

    if (!player.playing && !player.paused) player.play();
  }
};

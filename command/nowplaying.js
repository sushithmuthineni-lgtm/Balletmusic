const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, msToTime, progressBar } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing track'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const track = player.queue.current;
    const embed = baseEmbed()
      .setTitle('🎶 Now Playing')
      .setDescription(`**[${track.title}](${track.uri})**\nRequested by ${track.requester?.username || 'Unknown'}`)
      .addFields({
        name: '\u200b',
        value: `\`${msToTime(player.position)}\` ${progressBar(player.position, track.length)} \`${msToTime(track.length)}\``
      })
      .setThumbnail(track.thumbnail || null);

    return interaction.reply({ embeds: [embed] });
  }
};

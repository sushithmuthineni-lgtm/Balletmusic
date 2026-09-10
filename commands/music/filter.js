const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');
const { applyFilter } = require('../../utils/filters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Apply an audio filter to the current playback')
    .addStringOption((opt) =>
      opt
        .setName('name')
        .setDescription('Filter to apply')
        .setRequired(true)
        .addChoices(
          { name: 'Bass Boost', value: 'bassboost' },
          { name: 'Nightcore', value: 'nightcore' },
          { name: 'Vaporwave', value: 'vaporwave' },
          { name: 'Slowed', value: 'slowed' },
          { name: 'Reverse-style (slowed + muffled)', value: 'reverse' },
          { name: '8D', value: 'eightD' },
          { name: 'Karaoke', value: 'karaoke' },
          { name: 'Tremolo', value: 'tremolo' },
          { name: 'Vibrato', value: 'vibrato' },
          { name: 'Distortion', value: 'distortion' },
          { name: 'Chipmunk', value: 'chipmunk' },
          { name: 'China', value: 'china' },
          { name: 'Soft', value: 'soft' },
          { name: 'Clear / Off', value: 'clear' }
        )
    ),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const name = interaction.options.getString('name');
    const applied = await applyFilter(player, name);
    if (!applied) return interaction.reply({ embeds: [errorEmbed('Unknown filter.')], ephemeral: true });

    return interaction.reply({
      embeds: [successEmbed(name === 'clear' ? 'Cleared all filters.' : `Applied the **${name}** filter.`)]
    });
  }
};

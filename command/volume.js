const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume (0-150)')
    .addIntegerOption((opt) =>
      opt.setName('level').setDescription('Volume percentage').setRequired(true).setMinValue(0).setMaxValue(150)
    ),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const level = interaction.options.getInteger('level');
    player.setVolume(level);
    return interaction.reply({ embeds: [successEmbed(`Volume set to **${level}%**.`)] });
  }
};

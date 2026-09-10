const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current track'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    if (player.paused) return interaction.reply({ embeds: [errorEmbed('Already paused.')], ephemeral: true });
    player.pause(true);
    return interaction.reply({ embeds: [successEmbed('Paused the track.')] });
  }
};

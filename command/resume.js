const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused track'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    if (!player.paused) return interaction.reply({ embeds: [errorEmbed('Not paused.')], ephemeral: true });
    player.pause(false);
    return interaction.reply({ embeds: [successEmbed('Resumed the track.')] });
  }
};

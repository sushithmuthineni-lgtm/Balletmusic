const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('replay').setDescription('Restart the current track from 0:00'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    player.seek(0);
    return interaction.reply({ embeds: [successEmbed('Replaying from the start.')] });
  }
};

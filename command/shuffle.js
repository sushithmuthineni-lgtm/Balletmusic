const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the queue'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    if (player.queue.length < 2) {
      return interaction.reply({ embeds: [errorEmbed('Not enough tracks to shuffle.')], ephemeral: true });
    }
    player.queue.shuffle();
    return interaction.reply({ embeds: [successEmbed('Shuffled the queue.')] });
  }
};

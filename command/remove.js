const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue')
    .addIntegerOption((opt) => opt.setName('position').setDescription('Queue position (1 = next)').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const pos = interaction.options.getInteger('position') - 1;
    if (pos < 0 || pos >= player.queue.length) {
      return interaction.reply({ embeds: [errorEmbed('Invalid queue position.')], ephemeral: true });
    }
    const [removed] = player.queue.splice(pos, 1);
    return interaction.reply({ embeds: [successEmbed(`Removed **${removed.title}** from the queue.`)] });
  }
};

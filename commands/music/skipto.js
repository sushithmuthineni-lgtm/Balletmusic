const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Skip forward to a specific track in the queue')
    .addIntegerOption((opt) => opt.setName('position').setDescription('Queue position').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const pos = interaction.options.getInteger('position') - 1;
    if (pos < 0 || pos >= player.queue.length) {
      return interaction.reply({ embeds: [errorEmbed('Invalid queue position.')], ephemeral: true });
    }

    player.queue.splice(0, pos);
    player.skip();
    return interaction.reply({ embeds: [successEmbed(`Skipped to position ${pos + 1}.`)] });
  }
};

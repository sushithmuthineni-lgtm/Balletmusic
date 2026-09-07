const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a track to a new position in the queue')
    .addIntegerOption((opt) => opt.setName('from').setDescription('Current position').setRequired(true).setMinValue(1))
    .addIntegerOption((opt) => opt.setName('to').setDescription('New position').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const from = interaction.options.getInteger('from') - 1;
    const to = interaction.options.getInteger('to') - 1;

    if (from < 0 || from >= player.queue.length || to < 0 || to >= player.queue.length) {
      return interaction.reply({ embeds: [errorEmbed('Invalid position(s).')], ephemeral: true });
    }

    const [track] = player.queue.splice(from, 1);
    player.queue.splice(to, 0, track);
    return interaction.reply({ embeds: [successEmbed(`Moved **${track.title}** to position ${to + 1}.`)] });
  }
};

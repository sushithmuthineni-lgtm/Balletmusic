const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current track'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const skipped = player.queue.current;
    player.skip();
    return interaction.reply({ embeds: [successEmbed(`Skipped **${skipped.title}**.`)] });
  }
};

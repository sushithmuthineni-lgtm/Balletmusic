const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');
const { autoplayOn } = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('autoplay').setDescription('Toggle autoplay — keeps playing similar songs when the queue ends'),
  async execute(interaction) {
    const { error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const guildId = interaction.guild.id;
    if (autoplayOn.has(guildId)) {
      autoplayOn.delete(guildId);
      return interaction.reply({ embeds: [successEmbed('Autoplay **disabled**.')] });
    } else {
      autoplayOn.add(guildId);
      return interaction.reply({ embeds: [successEmbed('Autoplay **enabled** — I\'ll keep queueing similar tracks.')] });
    }
  }
};

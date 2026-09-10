const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { stayIn247 } = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('247').setDescription('Toggle 24/7 mode (bot stays in voice even when empty)'),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    if (!interaction.member.voice?.channel) {
      return interaction.reply({ embeds: [errorEmbed('Join a voice channel first.')], ephemeral: true });
    }

    if (stayIn247.has(guildId)) {
      stayIn247.delete(guildId);
      return interaction.reply({ embeds: [successEmbed('24/7 mode **disabled**. I\'ll leave when the channel is empty.')] });
    } else {
      stayIn247.add(guildId);
      return interaction.reply({ embeds: [successEmbed('24/7 mode **enabled**. I\'ll stay connected even when everyone leaves.')] });
    }
  }
};

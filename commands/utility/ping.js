const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot\'s latency'),
  async execute(interaction) {
    const sent = await interaction.reply({ embeds: [baseEmbed().setDescription('Pinging...')], fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    return interaction.editReply({
      embeds: [
        baseEmbed()
          .setDescription(
            `🏓 **Pong!**\nRoundtrip: \`${roundtrip}ms\`\nAPI Latency: \`${Math.round(interaction.client.ws.ping)}ms\``
          )
      ]
    });
  }
};

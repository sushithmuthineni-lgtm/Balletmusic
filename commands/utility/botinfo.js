const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');

function uptimeString(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Show information about Ballet'),
  async execute(interaction) {
    const client = interaction.client;
    const embed = baseEmbed()
      .setTitle('🎶 Ballet Music Bot')
      .addFields(
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Commands', value: `${client.commands.size}`, inline: true },
        { name: 'Uptime', value: uptimeString(client.uptime), inline: true },
        { name: 'discord.js', value: djsVersion, inline: true },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true }
      )
      .setThumbnail(client.user.displayAvatarURL());

    return interaction.reply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all available commands'),
  async execute(interaction) {
    const commands = interaction.client.commands;
    const categories = {};

    for (const cmd of commands.values()) {
      const cat = cmd.category || 'misc';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`\`/${cmd.data.name}\` — ${cmd.data.description}`);
    }

    const embed = baseEmbed()
      .setTitle('🎶 Ballet — Command List')
      .setDescription(`${commands.size} commands loaded. Use \`/\` in chat to see live autocomplete for all of these.`);

    for (const [cat, list] of Object.entries(categories)) {
      embed.addFields({ name: cat.charAt(0).toUpperCase() + cat.slice(1), value: list.join('\n') });
    }

    return interaction.reply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');
const { applyFilter } = require('../../utils/filters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bassboost')
    .setDescription('Quickly toggle bass boost on/off')
    .addBooleanOption((opt) => opt.setName('enabled').setDescription('Turn on or off').setRequired(true)),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const enabled = interaction.options.getBoolean('enabled');
    await applyFilter(player, enabled ? 'bassboost' : 'clear');
    return interaction.reply({ embeds: [successEmbed(enabled ? 'Bass boost **on**.' : 'Bass boost **off**.')] });
  }
};

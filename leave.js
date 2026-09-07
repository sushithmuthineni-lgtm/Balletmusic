const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');
const { stayIn247, autoplayOn } = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Disconnect the bot from voice'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    stayIn247.delete(interaction.guild.id);
    autoplayOn.delete(interaction.guild.id);
    player.destroy();
    return interaction.reply({ embeds: [successEmbed('Disconnected.')] });
  }
};

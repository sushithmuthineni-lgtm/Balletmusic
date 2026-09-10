const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');
const { stayIn247, autoplayOn } = require('../../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop playback, clear the queue, and disconnect'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    stayIn247.delete(interaction.guild.id);
    autoplayOn.delete(interaction.guild.id);
    player.queue.clear();
    player.destroy();
    return interaction.reply({ embeds: [successEmbed('Stopped playback and left the voice channel.')] });
  }
};

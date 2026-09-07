const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the loop mode')
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'none' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' }
        )
    ),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const mode = interaction.options.getString('mode');
    player.setLoop(mode);
    const label = { none: 'disabled', track: 'looping current track', queue: 'looping whole queue' }[mode];
    return interaction.reply({ embeds: [successEmbed(`Loop mode: **${label}**.`)] });
  }
};

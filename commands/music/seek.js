const { SlashCommandBuilder } = require('discord.js');
const ms = require('ms');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific time in the track')
    .addStringOption((opt) =>
      opt.setName('time').setDescription('Time to seek to, e.g. 1:30 or 90s').setRequired(true)
    ),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const raw = interaction.options.getString('time');
    let target;
    if (/^\d+:\d{1,2}$/.test(raw)) {
      const [m, s] = raw.split(':').map(Number);
      target = (m * 60 + s) * 1000;
    } else {
      target = ms(raw);
    }

    if (!target || isNaN(target)) {
      return interaction.reply({ embeds: [errorEmbed('Give a valid time like `1:30` or `90s`.')], ephemeral: true });
    }
    if (target > player.queue.current.length) {
      return interaction.reply({ embeds: [errorEmbed('That is longer than the track itself.')], ephemeral: true });
    }

    player.seek(target);
    return interaction.reply({ embeds: [successEmbed(`Seeked to \`${raw}\`.`)] });
  }
};

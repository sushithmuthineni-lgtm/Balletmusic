const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed, msToTime } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('grab').setDescription('DMs you the currently playing song so you can find it later'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction, { requireQueue: true });
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const track = player.queue.current;
    try {
      await interaction.user.send({
        embeds: [
          infoEmbed(`**[${track.title}](${track.uri})**\nDuration: \`${msToTime(track.length)}\`\nGrabbed from **${interaction.guild.name}**`)
        ]
      });
      return interaction.reply({ embeds: [successEmbed('Sent you a DM with this track!')], ephemeral: true });
    } catch {
      return interaction.reply({ embeds: [errorEmbed("I couldn't DM you — check your privacy settings.")], ephemeral: true });
    }
  }
};

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, msToTime } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current queue'),
  async execute(interaction) {
    const { player, error } = getActivePlayer(interaction);
    if (error) return interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });

    const current = player.queue.current;
    const upcoming = player.queue.slice(0, 10);

    const list = upcoming.length
      ? upcoming.map((t, i) => `**${i + 1}.** ${t.title} \`[${msToTime(t.length)}]\``).join('\n')
      : '*Queue is empty — add more with `/play`*';

    const embed = baseEmbed()
      .setTitle('📜 Current Queue')
      .setDescription(
        `**Now Playing:**\n${current ? `${current.title} \`[${msToTime(current.length)}]\`` : '*Nothing*'}\n\n**Up Next:**\n${list}`
      )
      .setFooter({ text: `${player.queue.length} track(s) in queue` });

    return interaction.reply({ embeds: [embed] });
  }
};

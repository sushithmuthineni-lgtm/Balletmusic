const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed } = require('../../utils/embeds');
const { getActivePlayer } = require('../../utils/playerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Get lyrics for the current or a specified song')
    .addStringOption((opt) => opt.setName('song').setDescription('Song name (defaults to now playing)').setRequired(false)),
  async execute(interaction) {
    let artist, title;
    const song = interaction.options.getString('song');

    if (song) {
      if (song.includes(' - ')) {
        [artist, title] = song.split(' - ').map((s) => s.trim());
      } else {
        artist = '';
        title = song;
      }
    } else {
      const { player } = getActivePlayer(interaction);
      if (!player?.queue.current) {
        return interaction.reply({ embeds: [errorEmbed('Nothing is playing — give me a song name instead.')], ephemeral: true });
      }
      artist = player.queue.current.author || '';
      title = player.queue.current.title;
    }

    await interaction.deferReply();
    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      const trimmed = data.lyrics.length > 3900 ? data.lyrics.slice(0, 3900) + '...' : data.lyrics;
      return interaction.editReply({ embeds: [baseEmbed().setTitle(`Lyrics: ${artist ? artist + ' - ' : ''}${title}`).setDescription(trimmed)] });
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed(`Couldn't find lyrics for that. Try \`/lyrics song: Artist - Title\` with the exact artist name.`)]
      });
    }
  }
};

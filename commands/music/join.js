const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('join').setDescription('Make the bot join your voice channel'),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) return interaction.reply({ embeds: [errorEmbed('Join a voice channel first.')], ephemeral: true });

    const music = interaction.client.music;
    let player = music.players.get(interaction.guild.id);
    if (player) return interaction.reply({ embeds: [errorEmbed("I'm already connected in this server.")], ephemeral: true });

    await music.createPlayer({
      guildId: interaction.guild.id,
      textId: interaction.channel.id,
      voiceId: voiceChannel.id,
      volume: 80,
      deaf: true
    });

    return interaction.reply({ embeds: [successEmbed(`Joined **${voiceChannel.name}**.`)] });
  }
};

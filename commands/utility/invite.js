const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('invite').setDescription('Get the bot invite link'),
  async execute(interaction) {
    const perms = PermissionsBitField.resolve([
      'ViewChannel', 'SendMessages', 'EmbedLinks', 'Connect', 'Speak', 'UseApplicationCommands'
    ]);
    const url = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=${perms}&scope=bot%20applications.commands`;
    return interaction.reply({ embeds: [infoEmbed(`[Click here to invite me to your server!](${url})`)] });
  }
};

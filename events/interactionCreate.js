const { errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[Command Error] /${interaction.commandName}:`, err);

      const isNodeError = err?.message?.includes('No node found') || err?.name === 'KazagumoError';
      const message = isNodeError
        ? "I can't reach the music server (Lavalink) right now — the bot owner needs to check its connection."
        : 'Something went wrong running that command.';

      const payload = { embeds: [errorEmbed(message)], ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }
};

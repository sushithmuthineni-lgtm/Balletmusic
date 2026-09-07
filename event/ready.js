const { REST, Routes, ActivityType } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`[Ballet] Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: '🎶 /help | 24/7 music', type: ActivityType.Listening }],
      status: 'online'
    });

    // Deploy slash commands
    const body = [...client.commands.values()].map((cmd) => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
      if (config.guildId) {
        await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
        console.log(`[Commands] Registered ${body.length} guild commands (instant, single server).`);
      } else {
        await rest.put(Routes.applicationCommands(config.clientId), { body });
        console.log(`[Commands] Registered ${body.length} global commands (can take up to 1hr to propagate).`);
      }
    } catch (err) {
      console.error('[Commands] Failed to register:', err);
    }
  }
};

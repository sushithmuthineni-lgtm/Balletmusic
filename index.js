const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { createMusicManager } = require('./utils/musicManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

loadCommands(client);
client.music = createMusicManager(client);
loadEvents(client);

process.on('unhandledRejection', (err) => console.error('[UnhandledRejection]', err));

client.login(config.token);

// Run this once (locally or via `node deploy-commands.js` on Railway's shell)
// whenever you add/change slash commands. It registers them with Discord.
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Your bot's Application ID
const GUILD_ID = process.env.GUILD_ID; // Optional: for instant per-server registration while testing

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID environment variable.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or Spotify')
    .addStringOption((option) =>
      option.setName('query').setDescription('Song name, YouTube link, or Spotify link').setRequired(true)
    ),
  new SlashCommandBuilder().setName('skip').setDescription('Skip the current track'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop playback and clear the queue'),
  new SlashCommandBuilder().setName('pause').setDescription('Pause playback'),
  new SlashCommandBuilder().setName('resume').setDescription('Resume playback'),
  new SlashCommandBuilder().setName('queue').setDescription('Show the current queue'),
  new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set playback volume')
    .addIntegerOption((option) =>
      option.setName('level').setDescription('Volume 0-100').setRequired(true).setMinValue(0).setMaxValue(100)
    ),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing track'),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);

    if (GUILD_ID) {
      // Guild commands update instantly - best for testing in one server
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`Registered commands to guild ${GUILD_ID}.`);
    } else {
      // Global commands can take up to an hour to propagate
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('Registered global commands (may take up to an hour to appear).');
    }
  } catch (err) {
    console.error(err);
  }
})();

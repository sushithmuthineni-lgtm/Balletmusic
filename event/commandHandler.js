const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  client.commands = new Map();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath);

  let count = 0;
  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(categoryPath, file));
      if (!command?.data?.name) {
        console.warn(`[Commands] Skipping ${file} — missing data.name`);
        continue;
      }
      command.category = category;
      client.commands.set(command.data.name, command);
      count++;
    }
  }
  console.log(`[Commands] Loaded ${count} commands across ${categories.length} categories.`);
}

module.exports = { loadCommands };

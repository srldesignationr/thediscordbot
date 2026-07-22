require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// --- 1. Web Server for Keep-Alive ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot status: ONLINE'));
app.listen(PORT, () => console.log(`HTTP ping server running on port ${PORT}`));

// --- 2. Discord Client Setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// --- 3. Dynamic Command Handler ---
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
  const commandFolders = fs.readdirSync(foldersPath);
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
    }
  }
}

// --- 4. Event: Ready ---
client.once('ready', () => {
  console.log(`Logged in securely as ${client.user.tag}`);
});

// --- 5. Event: Interaction Execution ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const errorMessage = { content: 'An unexpected error occurred while running this command.', flags: 64 }; // Ephemeral flag
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// --- 6. Security & Process Crash Shields ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// --- 7. Login ---
client.login(process.env.DISCORD_TOKEN);

const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Add GuildMessages and MessageContent intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ] 
});

// --- Dynamic Event Handler ---
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}
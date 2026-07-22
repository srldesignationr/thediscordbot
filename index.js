require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// --- 1. HTTP Server for Render Keep-Alive (cron-job.org) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot status: ONLINE'));
app.listen(PORT, () => console.log(`HTTP ping server running on port ${PORT}`));

// --- 2. Discord Client Setup with Required Intents ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for AutoMod word filtering
  ],
});

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
  console.log(`Loaded ${client.commands.size} slash commands.`);
}

// --- 4. Dynamic Event Handler (AutoMod, AuditLogger, Ready, etc.) ---
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
  console.log(`Loaded ${eventFiles.length} event listeners.`);
}

// --- 5. Interaction Event (Slash Command Execution) ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command /${interaction.commandName}:`, error);
    const errorMessage = {
      content: 'An unexpected error occurred while executing this command.',
      flags: 64, // Ephemeral flag (only visible to user)
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// --- 6. Ready Event ---
client.once('ready', () => {
  console.log(`Successfully logged in as ${client.user.tag}!`);
});

// --- 7. Security & Crash Shields (Prevents process death on Render) ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// --- 8. Bot Login ---
client.login(process.env.DISCORD_TOKEN);
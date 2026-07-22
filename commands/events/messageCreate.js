const { PermissionsBitField } = require('discord.js');

// Configurable lists (You can move these to a database later)
const BANNED_WORDS = ['badword1', 'badword2', 'scamlink'];
const LINK_REGEX = /(https?:\/\/[^\s]+)/g;

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // 1. Ignore bot messages and system messages
    if (message.author.bot || !message.guild) return;

    // 2. Bypass checks for Server Admins and Moderators
    if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return;
    }

    const content = message.content.toLowerCase();

    // 3. Banned Words Check
    const containsBannedWord = BANNED_WORDS.some(word => content.includes(word));
    if (containsBannedWord) {
      await deleteAndWarn(message, 'Your message contained a prohibited word.');
      return;
    }

    // 4. Link Spam Check (Deletes unauthorized links)
    if (LINK_REGEX.test(message.content)) {
      await deleteAndWarn(message, 'Posting links is not allowed in this channel.');
      return;
    }
  },
};

async function deleteAndWarn(message, reason) {
  try {
    // Delete the offending message
    await message.delete();

    // Send an ephemeral-style warning to the channel that deletes itself after 5 seconds
    const warning = await message.channel.send(
      `⚠️ ${message.author}, ${reason}`
    );
    setTimeout(() => warning.delete().catch(() => {}), 5000);
  } catch (error) {
    console.error('Failed to execute auto-mod action:', error);
  }
}

const { PermissionsBitField } = require('discord.js');
const { containsBannedWord } = require('../utils/wordFilter');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // Skip mods/admins
    if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return;
    }

    // Check remote blocklist
    const isViolating = await containsBannedWord(message.content);
    
    if (isViolating) {
      try {
        await message.delete();
        const warning = await message.channel.send(`⚠️ ${message.author}, your message contained prohibited language.`);
        setTimeout(() => warning.delete().catch(() => {}), 5000);
      } catch (err) {
        console.error('Failed to handle auto-mod deletion:', err);
      }
    }
  },
};
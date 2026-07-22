const { PermissionsBitField } = require('discord.js');
const { containsBannedWord } = require('/../utils/wordFilter');

const LINK_REGEX = /(https?:\/\/[^\s]+)/gi;

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bot messages and direct messages
    if (message.author.bot || !message.guild) return;

    // Skip moderators and admins (users with Manage Messages permission)
    if (message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return;
    }

    // 1. Check for banned words from en-LDNOOBW list
    const isViolatingWord = containsBannedWord(message.content);
    if (isViolatingWord) {
      await deleteAndWarn(message, 'Your message contained prohibited language.');
      return;
    }

    // 2. Check for unauthorized links
    if (LINK_REGEX.test(message.content)) {
      await deleteAndWarn(message, 'Posting links is not allowed in this channel.');
      return;
    }
  },
};

/**
 * Helper function to delete the offending message and issue a temporary warning
 */
async function deleteAndWarn(message, reason) {
  try {
    await message.delete();
    const warning = await message.channel.send(`⚠️ ${message.author}, ${reason}`);
    setTimeout(() => warning.delete().catch(() => {}), 5000);
  } catch (error) {
    console.error('Failed to execute auto-mod action:', error);
  }
}
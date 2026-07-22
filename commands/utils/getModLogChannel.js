const { ChannelType, PermissionFlagsBits } = require('discord.js');

/**
 * Finds the #modlog channel, or creates it with private permissions if missing.
 */
async function getModLogChannel(guild) {
  // 1. Try to find an existing text channel named "modlog"
  let logChannel = guild.channels.cache.find(
    channel => channel.name === 'modlog' && channel.isTextBased()
  );

  if (logChannel) return logChannel;

  // 2. If it doesn't exist, create it automatically
  try {
    console.log(`Creating #modlog channel in "${guild.name}"...`);
    logChannel = await guild.channels.create({
      name: 'modlog',
      type: ChannelType.GuildText,
      reason: 'Auto-created for bot audit logging',
      permissionOverwrites: [
        {
          // Hide from @everyone
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          // Allow the bot to view and send messages
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
        // Optional: If you have an Admin/Mod role, allow them to view it
      ],
    });

    // Send an initial welcome message
    await logChannel.send(
      '🛡️ **#modlog created!** All future administrative actions and settings changes will be logged here.'
    );

    return logChannel;
  } catch (error) {
    console.error(`Failed to auto-create #modlog channel in ${guild.name}:`, error);
    return null;
  }
}

module.exports = { getModLogChannel };
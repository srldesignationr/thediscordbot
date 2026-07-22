const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLog, guild) {
    console.log(`--- AUDIT EVENT FIRED --- Action: ${auditLog.action}`);

    try {
      // 1. Find or create the #modlog channel
      let modLogChannel = guild.channels.cache.find(
        (c) => c.name === 'modlog' || c.name === 'mod-log'
      );

      if (!modLogChannel) {
        console.log('No #modlog channel found. Creating one...');
        modLogChannel = await guild.channels.create({
          name: 'mod-log',
          reason: 'Auto-created for audit logging',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: guild.members.me.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
              ],
            },
          ],
        });
      }

      // 2. Extract executor and target info
      const { executor, target, action, reason } = auditLog;
      const executorName = executor ? `${executor.tag} (${executor.id})` : 'Unknown User';

      // 3. Format action title
      const actionTitle = AuditLogEvent[action] || `Action Code: ${action}`;

      // 4. Build the Log Embed
      const logEmbed = new EmbedBuilder()
        .setTitle(`🛡️ Audit Log: ${actionTitle}`)
        .setColor(0x5865f2) // Blurple
        .addFields(
          { name: 'Moderator / User', value: executorName, inline: true },
          { name: 'Target', value: target?.tag || target?.name || target?.id || 'N/A', inline: true }
        )
        .setTimestamp();

      if (reason) {
        logEmbed.addFields({ name: 'Reason', value: reason, inline: false });
      }

      // 5. Send to #modlog
      await modLogChannel.send({ embeds: [logEmbed] });
      console.log(`Successfully logged audit event to #${modLogChannel.name}`);
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  },
};
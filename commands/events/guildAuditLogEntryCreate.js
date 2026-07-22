const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { getModLogChannel } = require('../utils/getModLogChannel');

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLogEntry, guild) {
    // 1. Get or automatically create the #modlog channel
    const logChannel = await getModLogChannel(guild);
    if (!logChannel) return;

    const { action, executor, target, changes } = auditLogEntry;

    // 2. Resolve readable action name (e.g., ChannelCreate, RoleUpdate)
    const actionName = AuditLogEvent[action] 
      ? AuditLogEvent[action].replace(/([A-Z])/g, ' $1').trim() 
      : `Action #${action}`;

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Audit Log: ${actionName}`)
      .setColor('#5865F2')
      .setTimestamp()
      .addFields(
        { 
          name: 'Executed By', 
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : 'Unknown / System', 
          inline: true 
        },
        { 
          name: 'Target', 
          value: target ? `${target.tag || target.name || target.id}` : 'Server Settings', 
          inline: true 
        }
      );

    // 3. Format changed properties (Old Value ➔ New Value)
    if (changes && changes.length > 0) {
      const changeList = changes
        .map(change => {
          const oldVal = change.old !== undefined ? JSON.stringify(change.old) : '*None*';
          const newVal = change.new !== undefined ? JSON.stringify(change.new) : '*None*';
          return `**${change.key}**: \`${oldVal}\` ➔ \`${newVal}\``;
        })
        .join('\n');

      // Truncate to fit within Discord embed field limit (1024 chars)
      const safeChangeList = changeList.length > 1024 
        ? changeList.substring(0, 1021) + '...' 
        : changeList;

      embed.addFields({ name: 'Changes Made', value: safeChangeList });
    }

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      console.error(`Failed to send audit log entry in ${guild.name}:`, err);
    }
  },
};
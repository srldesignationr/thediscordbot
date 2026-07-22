const { EmbedBuilder } = require('discord.js');
const { getModLogChannel } = require('../utils/getModLogChannel');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    // 1. Get or automatically create the #modlog channel
    const logChannel = await getModLogChannel(newMember.guild);
    if (!logChannel) return;

    // 2. Track Nickname Changes
    if (oldMember.nickname !== newMember.nickname) {
      const nickEmbed = new EmbedBuilder()
        .setTitle('👤 Profile Update: Nickname Changed')
        .setColor('#FEE75C')
        .setTimestamp()
        .setDescription(`**User:** ${newMember.user.tag} (\`${newMember.id}\`)`)
        .addFields(
          { name: 'Old Nickname', value: oldMember.nickname || '*None (Username used)*', inline: true },
          { name: 'New Nickname', value: newMember.nickname || '*None (Reset to default)*', inline: true }
        );

      await logChannel.send({ embeds: [nickEmbed] }).catch(err => {
        console.error('Failed to send nickname update log:', err);
      });
    }

    // 3. Track Role Changes (Added or Removed)
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const roleEmbed = new EmbedBuilder()
        .setTitle('🏷️ Member Settings: Roles Updated')
        .setColor('#EB459E')
        .setTimestamp()
        .setDescription(`**User:** ${newMember.user.tag} (\`${newMember.id}\`)`);

      if (addedRoles.size > 0) {
        roleEmbed.addFields({ 
          name: 'Added Role(s)', 
          value: addedRoles.map(r => `<@&${r.id}>`).join(', ') 
        });
      }

      if (removedRoles.size > 0) {
        roleEmbed.addFields({ 
          name: 'Removed Role(s)', 
          value: removedRoles.map(r => `<@&${r.id}>`).join(', ') 
        });
      }

      await logChannel.send({ embeds: [roleEmbed] }).catch(err => {
        console.error('Failed to send role update log:', err);
      });
    }
  },
};
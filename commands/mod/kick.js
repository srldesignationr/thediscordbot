const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a target user from the server.')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers), // Hides from non-admins in UI

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(target.id);

    // Security Check: Prevents the bot from trying to kick owners or higher roles
    if (!member.kickable) {
      return interaction.reply({ content: 'I cannot kick this user because they have higher permissions than me.', flags: 64 });
    }

    await member.kick(reason);
    return interaction.reply({ content: `Kicked ${target.tag} for: ${reason}` });
  },
};
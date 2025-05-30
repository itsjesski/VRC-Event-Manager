import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const setManagerRoleCommand = new SlashCommandBuilder()
  .setName('setmanagerrole')
  .setDescription('Set which role can manage events')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption((option) =>
    option
      .setName('role')
      .setDescription('The role that will have event management permissions')
      .setRequired(true),
  );

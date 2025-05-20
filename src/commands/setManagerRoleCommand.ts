import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getManagerRoleId } from '../interactions/utils/settings/roleSettings';

const managerRoleId = getManagerRoleId();

export const setManagerRoleCommand = new SlashCommandBuilder()
  .setName('setmanagerrole')
  .setDescription('Set which role can manage events')
  .setDefaultMemberPermissions(managerRoleId ? managerRoleId : '0')
  .addRoleOption((option) =>
    option
      .setName('role')
      .setDescription('The role that will have event management permissions')
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
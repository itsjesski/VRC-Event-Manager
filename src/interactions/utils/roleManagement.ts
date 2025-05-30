import { Interaction, GuildMemberRoleManager, PermissionsBitField } from "discord.js";
import { getManagerRoleId } from "./settings/roleSettings";

export function userIsManager(interaction: Interaction) {
    // Always allow server administrators
    if (interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      return true;
    }
    
    const memberRoles = interaction.member?.roles;
    const managerRoleId = getManagerRoleId();
    
    if (!managerRoleId) {
      console.warn("No manager role ID configured");
      return false;
    }
    
    if (
      memberRoles instanceof GuildMemberRoleManager &&
      memberRoles.cache.has(managerRoleId)
    ) {
      return true;
    }
    return false;
}
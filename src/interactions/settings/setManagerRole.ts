import { CommandInteraction, CommandInteractionOptionResolver, CacheType } from 'discord.js';
import { setManagerRoleId } from '../utils/settings/roleSettings';

export async function handleSetManagerRole(interaction: CommandInteraction) {
  console.log("Handling setmanagerrole command");
  
  if (!interaction.isCommand() || interaction.commandName !== 'setmanagerrole') {
    console.log("Not a setmanagerrole command, returning");
    return;
  }
  
  try {
    // Cast options to the correct type
    const options = interaction.options as CommandInteractionOptionResolver<CacheType>;
    const role = options.getRole('role');
    
    console.log(`Role selected: ${role?.name || 'None'}`);
    
    if (!role) {
      await interaction.reply({
        content: 'Error: Role not found.',
        ephemeral: true
      });
      return;
    }
    
    setManagerRoleId(role.id);
    console.log(`Set manager role ID to: ${role.id}`);
    
    await interaction.reply({
      content: `✅ Manager role successfully set to ${role.name}! This role now has permissions to create and edit events.`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Error in handleSetManagerRole:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content: 'An error occurred while setting the manager role.',
        ephemeral: true
      });
    }
  }
}
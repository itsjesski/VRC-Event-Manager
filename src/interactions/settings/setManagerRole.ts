import { CommandInteraction, CommandInteractionOptionResolver, CacheType } from 'discord.js';
import { setManagerRoleId } from '../utils/settings/roleSettings';

export async function handleSetManagerRole(interaction: CommandInteraction) {
  if (!interaction.isCommand() || interaction.commandName !== 'setmanagerrole') return;
  
  // Cast options to the correct type
  const options = interaction.options as CommandInteractionOptionResolver<CacheType>;
  const role = options.getRole('role');
  
  if (!role) {
    await interaction.reply({
      content: 'Error: Role not found.',
      ephemeral: true
    });
    return;
  }
  
  setManagerRoleId(role.id);
  
  await interaction.reply({
    content: `✅ Manager role successfully set to ${role.name}! This role now has permissions to create and edit events.`,
    ephemeral: true
  });
}
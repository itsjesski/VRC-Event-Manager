import {
  Interaction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType
} from 'discord.js';

function extractSlotList(content: string): string[] {
  const slotListMatch = content.match(/Slot #\d+ - <t:\d+:F>:[^\n]*/g);
  return slotListMatch ? slotListMatch : [];
}

export const handleRemoveButtonInteraction = async (
  interaction: Interaction,
) => {
  if (!interaction.isButton() || interaction.customId !== 'remove') return;

  const message = interaction.message;
  const content = message.content;
  
  // Extract data from message
  const slotList = extractSlotList(content);
  const userMention = `<@!${interaction.user.id}>`;
  
  // Find which slots the user is signed up for
  const userSlots = slotList.filter(slot => slot.includes(userMention));
  
  // Generate status message showing user's current signups
  const generateStatusMessage = (userSlots: string[], allSlots: string[]) => {
    let statusMessage = "**Your Current Signups:**\n";
    if (userSlots.length === 0) {
      statusMessage += "You haven't signed up for any slots yet.\n";
    } else {
      userSlots.forEach((slot) => {
        const slotNumber = allSlots.indexOf(slot) + 1;
        statusMessage += `- Slot #${slotNumber}\n`;
      });
    }
    return statusMessage;
  };
  
  // Check if user has any slots to remove
  if (userSlots.length === 0) {
    await interaction.reply({
      content: "You are not signed up for any slots.",
      ephemeral: true
    });
    return;
  }
  
  // Build the select menu for slots
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`removeSlot_${message.id}`)
    .setPlaceholder('Select slots to remove yourself from')
    .setMinValues(1)
    .setMaxValues(userSlots.length);
    
  // Add options for user's slots
  for (let i = 0; i < slotList.length; i++) {
    const slot = slotList[i];
    
    // Only show slots the user is in
    if (slot.includes(userMention)) {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(`Slot ${i + 1}`)
          .setDescription(`Remove yourself from this slot`)
          .setValue(`${i}`)
      );
    }
  }
  
  // Create the action row with the select menu
  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);
  
  // Send the interface as an ephemeral message
  const response = await interaction.reply({
    content: `${generateStatusMessage(userSlots, slotList)}\n**Select slots to remove yourself from:**\n\nYou can select multiple slots at once by clicking several of them.`,
    components: [row],
    ephemeral: true,
    fetchReply: true
  });
  
  // Create a collector to listen for interactions
  const collector = response.createMessageComponentCollector({ 
    time: 60000, // Timeout after 1 minute
    componentType: ComponentType.StringSelect,
    max: 1 // Only collect one interaction - when they make their selections
  });
  
  collector.on('collect', async i => {
    if (!i.isStringSelectMenu()) return;
    
    // Get all selected slot indices
    const selectedSlotIndices = i.values.map(value => parseInt(value, 10));
    
    // Get the latest message content to ensure we have current signups
    const currentMessage = await interaction.channel?.messages.fetch(message.id);
    if (!currentMessage) {
      await i.update({ 
        content: "Error: Could not find the original message. Please try again.",
        components: [] 
      });
      return;
    }
    
    const currentContent = currentMessage.content;
    const currentSlotList = extractSlotList(currentContent);
    
    // Process all selected slots
    let updatedContent = currentContent;
    let successfulRemovals = 0;
    let errorMessages = [];
    
    for (const slotIndex of selectedSlotIndices) {
      const currentSlotList = extractSlotList(updatedContent);
      const slot = currentSlotList[slotIndex];
      
      // Check if slot is valid
      if (!slot) {
        errorMessages.push(`Error: Slot #${slotIndex + 1} not found.`);
        continue;
      }
      
      // Check if user is in this slot
      if (!slot.includes(userMention)) {
        errorMessages.push(`You're not signed up for Slot #${slotIndex + 1}.`);
        continue;
      }
      
      // Remove the user from the slot
      const updatedSlot = slot.replace(userMention, '').replace(/\s+/g, ' ').trim();
      updatedContent = updatedContent.replace(slot, updatedSlot);
      successfulRemovals++;
    }
    
    // Only update the original message if we made changes
    if (successfulRemovals > 0) {
      await currentMessage.edit({ content: updatedContent });
    }
    
    // Generate result message
    const updatedSlotList = extractSlotList(updatedContent);
    const remainingUserSlots = updatedSlotList.filter(slot => slot.includes(userMention));
    const statusMessage = generateStatusMessage(remainingUserSlots, updatedSlotList);
    
    let resultMessage = statusMessage + "\n";
    
    if (successfulRemovals > 0) {
      resultMessage += `✅ Successfully removed from ${successfulRemovals} slot${successfulRemovals !== 1 ? 's' : ''}!\n`;
    }
    
    if (errorMessages.length > 0) {
      resultMessage += "\n**Errors:**\n" + errorMessages.join("\n") + "\n";
    }
    
    // Update the response
    await i.update({ 
      content: resultMessage,
      components: [] 
    });
  });
  
  collector.on('end', async collected => {
    if (collected.size === 0) {
      // If the collector times out without any selections
      await interaction.editReply({
        content: "Removal selection timed out.",
        components: []
      }).catch(() => {}); // Ignore errors if the message was deleted
    }
  });
};
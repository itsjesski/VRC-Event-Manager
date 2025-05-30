import {
  Interaction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

function extractSlotList(content: string): string[] {
  const slotListMatch = content.match(/Slot #\d+ - <t:\d+:F>:[^\n]*/g);
  return slotListMatch ? slotListMatch : [];
}

function extractPeoplePerSlot(content: string): number {
  const peoplePerSlotMatch = content.match(/with (\d+) people per slot/);
  return peoplePerSlotMatch ? parseInt(peoplePerSlotMatch[1], 10) : 10;
}

function extractSlotsPerPerson(content: string): number {
  const slotsPerPersonMatch = content.match(/sign up for (\d+) slots/);
  return slotsPerPersonMatch ? parseInt(slotsPerPersonMatch[1], 10) : 10;
}

export const handleSignUpButtonInteraction = async (
  interaction: Interaction,
) => {
  if (!interaction.isButton() || interaction.customId !== 'signUp') return;

  const message = interaction.message;
  const content = message.content;
  
  // Extract data from message
  const slotList = extractSlotList(content);
  const peoplePerSlot = extractPeoplePerSlot(content);
  const slotsPerPerson = extractSlotsPerPerson(content);
  const userMention = `<@!${interaction.user.id}>`;
  
  // Create a function to generate the select menu
  const createMenu = (currentContent: string) => {
    const currentSlotList = extractSlotList(currentContent);
    const userSlots = currentSlotList.filter(slot => slot.includes(userMention));
    
    // Calculate how many more slots the user can sign up for
    const slotsRemaining = slotsPerPerson - userSlots.length;
    if (slotsRemaining <= 0) return null;
    
    // Build the select menu for slots
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`slotSelect_${message.id}`)
      .setPlaceholder('Select slots to sign up for')
      .setMinValues(1)
      .setMaxValues(slotsRemaining); // Allow selecting up to their remaining limit
      
    // Add options for available slots
    let availableSlots = 0;
    for (let i = 0; i < currentSlotList.length; i++) {
      const slot = currentSlotList[i];
      const signUps = (slot.match(/<@!\d+>/g) || []).length;
      
      // Only show slots that have space and user isn't already in
      if (signUps < peoplePerSlot && !slot.includes(userMention)) {
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(`Slot ${i + 1}`)
            .setDescription(`${signUps}/${peoplePerSlot} people signed up`)
            .setValue(`${i}`)
        );
        availableSlots++;
      }
    }
    
    if (availableSlots === 0) return null;
    
    return { 
      menu: selectMenu, 
      availableSlots, 
      userSlots,
      slotsRemaining
    };
  };
  
  // Get menu state
  const menuState = createMenu(content);
  
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
  
  // Check if user can sign up for slots
  if (!menuState || menuState.slotsRemaining <= 0) {
    await interaction.reply({
      content: `You've reached your limit of ${slotsPerPerson} slots! Remove yourself from a slot before signing up for another.`,
      ephemeral: true
    });
    return;
  }
  
  if (!menuState.menu || menuState.availableSlots === 0) {
    await interaction.reply({
      content: "There are no available slots you can sign up for.",
      ephemeral: true
    });
    return;
  }
  
  // Create the action row with the select menu
  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(menuState.menu);
  
  // Send the interface as an ephemeral message
  const response = await interaction.reply({
    content: `${generateStatusMessage(menuState.userSlots, slotList)}\n**Select slots to sign up for:**\n\nYou can select up to ${menuState.slotsRemaining} more slots. You can choose multiple slots at once by clicking several options.`,
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
    let successfulSignups = 0;
    let errorMessages = [];
    
    for (const slotIndex of selectedSlotIndices) {
      const currentSlotList = extractSlotList(updatedContent);
      const slot = currentSlotList[slotIndex];
      
      // Check if slot is valid
      if (!slot) {
        errorMessages.push(`Error: Slot #${slotIndex + 1} not found.`);
        continue;
      }
      
      // Check if slot is full
      const signUps = (slot.match(/<@!\d+>/g) || []).length;
      if (signUps >= peoplePerSlot) {
        errorMessages.push(`Slot #${slotIndex + 1} is full.`);
        continue;
      }
      
      // Check if user is already in this slot
      if (slot.includes(userMention)) {
        errorMessages.push(`You're already signed up for Slot #${slotIndex + 1}.`);
        continue;
      }
      
      // Update the slot with the user mention
      const updatedSlot = `${slot} ${userMention}`;
      updatedContent = updatedContent.replace(slot, updatedSlot);
      successfulSignups++;
    }
    
    // Only update the original message if we made changes
    if (successfulSignups > 0) {
      await currentMessage.edit({ content: updatedContent });
    }
    
    // Generate result message
    const updatedSlotList = extractSlotList(updatedContent);
    const userSlots = updatedSlotList.filter(slot => slot.includes(userMention));
    const statusMessage = generateStatusMessage(userSlots, updatedSlotList);
    
    let resultMessage = statusMessage + "\n";
    
    if (successfulSignups > 0) {
      resultMessage += `✅ Successfully signed up for ${successfulSignups} slot${successfulSignups !== 1 ? 's' : ''}!\n`;
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
        content: "Signup selection timed out.",
        components: []
      }).catch(() => {}); // Ignore errors if the message was deleted
    }
  });
};
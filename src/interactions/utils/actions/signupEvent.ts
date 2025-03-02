import {
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { chunkArray } from '../generalUtilities';

function extractSlotList(content: string): string[] {
  const slotListMatch = content.match(/Slot #\d+ - <t:\d+:F>:[^\n]*/g);
  return slotListMatch ? slotListMatch : [];
}

function extractPeoplePerSlot(content: string): number {
  const peoplePerSlotMatch = content.match(/with (\d+) people per slot/);
  return peoplePerSlotMatch ? parseInt(peoplePerSlotMatch[1], 10) : 0;
}

function extractSlotsPerPerson(content: string): number {
  const slotsPerPersonMatch = content.match(/max (\d+) slots per person/);
  return slotsPerPersonMatch ? parseInt(slotsPerPersonMatch[1], 10) : 1;
}

export const handleSignUpButtonInteraction = async (
  interaction: Interaction,
) => {
  if (!interaction.isButton() || interaction.customId !== 'signUp') return;

  const message = interaction.message;
  const content = message.content;

  // Extract slot list from the message content
  const slotList = extractSlotList(content);

  // Extract people per slot limit
  const peoplePerSlot = extractPeoplePerSlot(content);

  // Generate buttons for each slot that has space left
  const rows = generateSlotButtons(slotList, peoplePerSlot, message.id);

  // Construct the slot list string
  const slotListString = slotList.join('\n');

  // Reply with the slot list and the action rows
  await interaction.reply({
    content: `**Available Slots:**\n\n${slotListString}`,
    components: rows,
    ephemeral: true,
  });
};

function generateSlotButtons(slotList: string[], peoplePerSlot: number, messageId: string) {
  const rows = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  for (let i = 0; i < slotList.length; i++) {
    const slot = slotList[i];
    const signUps = (slot.match(/<@!\d+>/g) || []).length;
    if (signUps < peoplePerSlot) {
      const button = new ButtonBuilder()
        .setCustomId(`signUpSlot_${i}_${messageId}`)
        .setLabel(`Slot ${i + 1}`)
        .setStyle(ButtonStyle.Primary);

      currentRow.addComponents(button);

      // If the current row has 5 buttons, push it to rows and start a new row
      if (currentRow.components.length === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder<ButtonBuilder>();
      }
    }
  }

  // Push the last row if it has any buttons
  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

export const handleSlotSelectionInteraction = async (
  interaction: Interaction,
) => {
  if (!interaction.isButton() || !interaction.customId.startsWith('signUpSlot_')) return;

  const message = interaction.message;
  const content = message.content;
  const userMention = `<@!${interaction.user.id}>`;

  // Extract slot list from the message content
  const slotList = extractSlotList(content);

  // Extract people per slot limit
  const peoplePerSlot = extractPeoplePerSlot(content);

  // Extract the slot index from the custom ID
  const slotIndex = parseInt(interaction.customId.split('_')[1], 10);

  // Check if the user is already signed up for the slot
  if (slotList[slotIndex].includes(userMention)) {
    await interaction.reply({
      content: 'You are already signed up for this slot.',
      ephemeral: true,
    });
    return;
  }

  // Check if the user has reached their slot limit
  const slotsPerPerson = extractSlotsPerPerson(content);
  const userSlots = slotList.filter((slot) => slot.includes(userMention));
  if (userSlots.length >= slotsPerPerson) {
    await interaction.reply({
      content: `You have reached your slot limit of ${slotsPerPerson}.`,
      ephemeral: true,
    });
    return;
  }

  // Check if the slot has space left
  const signUps = (slotList[slotIndex].match(/<@!\d+>/g) || []).length;
  if(signUps >= peoplePerSlot) {
    await interaction.reply({
      content: 'This slot is full.',
      ephemeral: true,
    });
    return;
  }

  // Sign the user up for the slot by adding their Discord mention
  const updatedSlot = `${slotList[slotIndex]} ${userMention}`;

  // Update the slot list with the new sign-up
  slotList[slotIndex] = updatedSlot;

  // Update the message content by replacing the specific slot line
  const updatedContent = content.replace(slotList[slotIndex], updatedSlot);

  await message.edit({ content: updatedContent });

  await interaction.reply({
    content: `You have signed up for slot ${slotIndex + 1}.`,
    ephemeral: true,
  });
};
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

  // Extract slot list from the message content
  const slotList = extractSlotList(content);

  // Extract people per slot limit
  const peoplePerSlot = extractPeoplePerSlot(content);

  // Generate buttons for each slot that has space left
  const rows = generateSlotButtons(slotList, peoplePerSlot, message.id, interaction.user.id);

  // Construct the slot list string
  const slotListString = slotList.join('\n');

  // Add snapshot notice
  const snapshotNotice = "\n*For ease of use, a snapshot of the signup list is provided. However, only the original signup list will be updated when you click the buttons.*";

  // Reply with the slot list, snapshot notice, and the action rows
  await interaction.reply({
    content: `**Click the buttons below to sign up!**${snapshotNotice}\n\n${slotListString}`,
    components: rows,
    ephemeral: true,
  });
};

function generateSlotButtons(slotList: string[], peoplePerSlot: number, messageId: string, userId: string) {
  const rows = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();
  const userMention = `<@!${userId}>`;

  for (let i = 0; i < slotList.length; i++) {
    const slot = slotList[i];
    const signUps = (slot.match(/<@!\d+>/g) || []).length;

    // Skip creating a button if the user is already signed up for the slot
    if (signUps < peoplePerSlot && !slot.includes(userMention)) {
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

  const [_, slotIndex, originalMessageId] = interaction.customId.split('_');
  const message = await interaction.channel?.messages.fetch(originalMessageId);
  if (!message) {
    await interaction.reply({
      content: 'Error: Original message not found.',
      ephemeral: true,
    });
    return;
  }

  // Convert slotIndex to a number
  const slotIndexNumber = parseInt(slotIndex, 10);

  const content = message.content;
  const userMention = `<@!${interaction.user.id}>`;

  // Extract slot list from the message content
  const slotList = extractSlotList(content);

  // Extract people per slot limit
  const peoplePerSlot = extractPeoplePerSlot(content);

  // Extract slots per person limit
  const slotsPerPerson = extractSlotsPerPerson(content);

  // Check if the user is already signed up for the slot
  if (slotList[slotIndexNumber].includes(userMention)) {
    await interaction.reply({
      content: 'You are already signed up for this slot. Please select another slot.',
      ephemeral: true,
    });
    return;
  }

  // Check if the user has reached their slot limit
  const userSlots = slotList.filter((slot) => slot.includes(userMention));
  if (userSlots.length >= slotsPerPerson) {
    await interaction.reply({
      content: `You are at your slot limit! Remove yourself from a slot before signing up for another.`,
      ephemeral: true,
    });
    return;
  }

  // Check if the slot has space left
  const signUps = (slotList[slotIndexNumber].match(/<@!\d+>/g) || []).length;
  if(signUps >= peoplePerSlot) {
    await interaction.reply({
      content: 'This slot is full. Please select another slot.',
      ephemeral: true,
    });
    return;
  }

  // Sign the user up for the slot by adding their Discord mention
  const updatedSlot = `${slotList[slotIndexNumber]} ${userMention}`;

  // Update the message content by replacing the specific slot line
  const updatedContent = content.replace(slotList[slotIndexNumber], updatedSlot);

  await message.edit({ content: updatedContent });

  await interaction.reply({
    content: `You have signed up for slot ${slotIndexNumber + 1}.`,
    ephemeral: true,
  });
};
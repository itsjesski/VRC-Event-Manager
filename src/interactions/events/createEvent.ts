import {
  CommandInteractionOptionResolver,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  CacheType,
  CommandInteraction,
} from 'discord.js';
import * as dotenv from 'dotenv';
import { getEventTemplate } from '../utils/templates/eventTemplate';

dotenv.config();

export const handleCreateEvent = async (
  interaction: CommandInteraction<CacheType>,
) => {
  if (!interaction.isCommand()) return;

  // Add a deferred reply in case the processing takes too long
  await interaction.deferReply({ ephemeral: true });

  try {
    const options =
    interaction.options as CommandInteractionOptionResolver<CacheType>;
    const startTimeUnix = options.getString('starttime', true);
    const slots = options.getInteger('slots', true);
    const peoplePerSlot = options.getInteger('peopleperslot', true);
    const slotsPerPerson = options.getInteger('slotsperperson', true);
    const duration = options.getInteger('duration', true);
    const description = options.getString('description') || '[DESCRIPTION HERE]';
    const eventTitle = options.getString('title') || '[TITLE HERE]';

    // Generate slot timestamps
    const slotTimestamps = [];
    for (let i = 0; i < slots; i++) {
      const slotStartTime = Number(startTimeUnix) + i * duration * 60;
      slotTimestamps.push(`<t:${Math.floor(slotStartTime)}:F>`);
    }

    // Create a list of slots with timestamps
    const slotList = slotTimestamps
      .map((timestamp, index) => `Slot #${index + 1} - ${timestamp}:`)
      .join('\n');

    // Pre-built template
    const template = getEventTemplate(
      eventTitle,
      startTimeUnix,
      slots,
      peoplePerSlot,
      slotsPerPerson,
      duration,
      description,
      slotList,
    );

    const modal = new ModalBuilder()
      .setCustomId('createEventModal')
      .setTitle('Create Event');

    const templateInput = new TextInputBuilder()
      .setCustomId('template')
      .setLabel('Event Details')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(template)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(templateInput),
    );

    await interaction.deleteReply();
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error handling create event:', error);
    
    // Only reply if we haven't already
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'An error occurred while creating the event. Please try again later.',
        ephemeral: true
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: 'An error occurred while creating the event. Please try again later.',
      });
    }
  }
  
};
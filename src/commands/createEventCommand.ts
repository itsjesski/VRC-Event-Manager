import { SlashCommandBuilder } from 'discord.js';

export const createEventCommand = new SlashCommandBuilder()
  .setName('event')
  .setDescription('Create a new event')
  .addStringOption((option) =>
    option
      .setName('starttime')
      .setDescription('The start time of the event')
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('slots')
      .setDescription('The number of slots')
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('peopleperslot')
      .setDescription('The number of people per slot')
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('slotsperperson')
      .setDescription('The number of slots each person can take.')
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('duration')
      .setDescription('The duration of each slot in minutes')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('title')
      .setDescription('The title of the event')
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName('description')
      .setDescription('The description of the event')
      .setRequired(false),
  );

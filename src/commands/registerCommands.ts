import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

// Imports for individual commands.
import { createEventCommand } from './createEventCommand';

dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  throw new Error('Missing DISCORD_TOKEN in environment variables');
}

if (!process.env.DISCORD_APP_ID) {
  throw new Error('Missing DISCORD_APP_ID in environment variables');
}

const commands = [createEventCommand].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

export async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands...');
    await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID!), {
      body: commands,
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error reloading application (/) commands:', error);
    throw error; // Re-throw to allow proper handling in index.ts
  }
}
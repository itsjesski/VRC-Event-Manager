import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

// Imports for individual commands.
import { createEventCommand } from './createEventCommand';

dotenv.config();

const commands = [createEventCommand].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

export async function registerCommands() {
  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID!), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error reloading application (/) commands:', error);
  }
}

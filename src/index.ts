import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { interactionManager } from './interactions/interactionManager';
import { registerCommands } from './commands/registerCommands';
import './healthCheck'; // Import the health check server

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', () => {
  console.log('Signup Bot is online!');
});

client.on('interactionCreate', async (interaction) => {
  await interactionManager(interaction);
});

// Register commands before logging in the bot
registerCommands()
  .then(() => {
    client.login(process.env.DISCORD_TOKEN);
  })
  .catch((error) => {
    console.error('Failed to register commands:', error);
  });
